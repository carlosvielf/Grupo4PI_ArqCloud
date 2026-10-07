# Integração de Dados — Grupo 4

Auditoria e integração executadas em 07/10/2026. Nenhuma senha é registrada neste documento. Fonte pública consultada: `https://lapps.studio/disciplinas/projeto-integrador-arquiteturas-cloud/dados/`.

## 1. Arquitetura encontrada

Antes das alterações, o repositório continha somente uma SPA React 19 + TypeScript + Vite 6. Os dados vinham de `src/mocks/data.ts` por um `FarmProvider`; havia um cliente HTTP configurável, mas nenhum backend ou endpoint real. Recharts desenhava os gráficos, React Router definia nove rotas e Playwright cobria o navegador com respostas interceptadas.

Arquitetura implementada:

```text
React/Vite ── HTTP/SSE ──> Backend Node
                           ├── MariaDB grupo4
                           ├── MongoDB grupo4
                           ├── Redis grupo4:*
                           ├── MinIO bucket grupo4
                           └── MQTT fazenda/grupo4/#
```

O backend usa pools/conexões reutilizadas, transforma os schemas reais no contrato já esperado pelo frontend, serve o build de produção e recusa iniciar se algum escopo configurado não for exatamente `grupo4`.

## 2. Dados mockados encontrados

| Componente | Arquivo | Mock anterior | Fonte real |
| --- | --- | --- | --- |
| KPIs do dashboard | `src/pages/Dashboard.tsx` | contagens de 6 talhões, 48 SVGs, 4 alertas e 4 máquinas | MariaDB + MongoDB + Redis |
| Cards e detalhe de talhões | `src/components/talhoes/TalhaoCard.tsx`, `src/pages/TalhaoDetail.tsx` | códigos, áreas, culturas e NDVI em arrays | MariaDB `talhao`/`cultura` + MongoDB `imagens.ndvi_medio` |
| Gráficos e tabela NDVI | `src/components/charts/NdviChart.tsx`, `src/pages/Analises.tsx` | 48 leituras inventadas | MongoDB `imagens` (48 documentos reais) |
| Galeria/comparação | `src/pages/Imagens.tsx`, `src/components/imagens/*` | 18 SVGs procedurais reutilizados em 48 registros | MongoDB `imagens` + PNGs privados do MinIO |
| Alertas | `src/components/alerts/AlertList.tsx`, `src/pages/Alertas.tsx` | 4 ocorrências estáticas | MongoDB `alertas` + Redis `grupo4:alertas:recentes` |
| Máquinas e telemetria | `src/pages/Maquinas.tsx`, `src/pages/Telemetria.tsx` | 20 pontos de quatro equipamentos | MariaDB `maquina` + MongoDB `telemetria_maquinas` + MQTT quando há operação |

O mock foi removido do fluxo normal: API é o padrão e não existe fallback. O modo `demo` e seus assets permanecem exclusivamente para os testes legados, ativados explicitamente por `VITE_DATA_SOURCE=demo`.

## 3. MariaDB

Database usado: `grupo4`.

Tabelas descobertas: `cliente`, `cultura`, `estoque_movimento`, `fazenda`, `funcionario`, `insumo`, `maquina`, `operacao`, `safra`, `sensor`, `talhao`, `venda`.

Contagens reais: cliente 6; cultura 5; estoque 300; fazenda 1; funcionário 10; insumo 13; máquina 6; operação 137; safra 30; sensor 7; talhão 6; venda 38. Foram inspecionadas colunas, tipos, PKs, FKs, índices e intervalos de datas via `information_schema`, sempre no schema `grupo4`.

Uso no sistema:

- `talhao JOIN cultura`: código, área em hectares e cultura atual para cards/detalhes.
- `maquina`: nome descritivo associado ao código presente na telemetria.
- `sensor JOIN talhao`: associação segura de alertas recentes ao talhão.
- `/api/health`: `SELECT 1` real.

## 4. MongoDB

Database usado: `grupo4`, autenticação em `admin`.

| Collection | Documentos | Intervalo real | Uso |
| --- | ---: | --- | --- |
| `leituras` | 81.058 | 01/06 a 29/09/2026 | persistência idempotente futura do MQTT; não é usada como NDVI |
| `telemetria_maquinas` | 5.782 | 06/06 a 21/09/2026 | máquinas e gráfico operacional |
| `alertas` | 244 | 01/06 a 29/09/2026 | central de alertas |
| `imagens` | 48 | 05/06 a 25/09/2026 | catálogo MinIO e série `ndvi_medio` |

Severidades reais: `alta` (1), `baixa` (3), `media` (240). Tipos reais: `chuva_intensa` (3), `sensor_offline` (1), `solo_seco` (240). Máquinas com telemetria: M01 (524), M03 (1.573), M05 (3.685).

As consultas usam projeção, ordenação e limites: 100 imagens/NDVI, 250 alertas e 2.000 pontos recentes de telemetria por resposta (máximo permitido: 5.000).

## 5. Redis

Somente `SCAN MATCH grupo4:* COUNT 100` foi usado. Foram encontradas 19 chaves, todas sem TTL (`-1`), nos seguintes padrões:

- `grupo4:sensor:*`: 7 hashes de estado atual;
- `grupo4:talhao:*`: 6 hashes;
- `grupo4:stream:leituras`: stream recente;
- `grupo4:alertas:recentes`: lista dos alertas atuais;
- `grupo4:ranking:produtividade:2025-26`: sorted set;
- `grupo4:contador:*`: 2 strings;
- `grupo4:fazenda`: hash.

A API combina até 50 alertas recentes do Redis com o histórico MongoDB e remove duplicatas por timestamp/tipo/sensor.

## 6. MQTT

Assinatura exclusiva: `fazenda/grupo4/#`, QoS 0, sem publicação.

Foi escolhida a porta TCP no backend. A porta WebSocket não é usada diretamente pelo frontend para evitar expor credenciais MQTT no bundle ou no navegador.

Em 75 segundos foram observadas 17 mensagens reais em dois ciclos: `fazenda/grupo4/status`, `fazenda/grupo4/sensores/EST-01` e `fazenda/grupo4/sensores/SS-01` a `SS-06`. A frequência observada foi aproximadamente 60 segundos. Os payloads JSON continham `sensor`, `tipo`, `talhao`, `ts`, `bateria_pct`, `firmware` e `valores`; a estação tinha clima e as sondas tinham umidade/temperatura/condutividade do solo.

Não houve mensagem de máquina ou alerta nessa janela (fora do horário operacional e sem novo evento). O consumidor implementado valida JSON, reconecta, ignora qualquer tópico fora do prefixo e:

- persiste leituras, telemetria e alertas com `updateOne + $setOnInsert + upsert` quando `MQTT_PERSIST_ENABLED=true`;
- envia SSE somente para eventos que afetam telas existentes (`alertas` e `telemetria`);
- não publica no broker.

## 7. MinIO

Bucket usado: `grupo4`, mantido privado.

Foram localizados 49 objetos: 48 PNGs em `ndvi/T01..T06/AAAA-MM-DD.png` e `laudos/analise_solo_2026.csv`. Os PNGs têm oito datas por talhão. O dashboard usa somente os objetos referenciados pelos documentos MongoDB e aceitos pelo padrão fixo de chave. O navegador recebe a imagem por `/api/imagens/:id/content`; nenhuma credencial ou URL permanente é exposta.

O laudo CSV não corresponde a um componente existente e não foi encaixado artificialmente no dashboard.

## 8. API

| Método | Endpoint | Fonte | Finalidade |
| --- | --- | --- | --- |
| GET | `/api/talhoes` | MariaDB | cards e detalhes dos seis talhões |
| GET | `/api/imagens` | MongoDB | catálogo e URLs intermediárias |
| GET | `/api/imagens/:id/content` | MongoDB + MinIO | PNG privado validado |
| GET | `/api/leituras` | MongoDB `imagens` | série temporal de NDVI médio |
| GET | `/api/alertas` | MongoDB + Redis | histórico e eventos recentes |
| GET | `/api/telemetria` | MongoDB + MariaDB | pontos e nomes de máquinas |
| GET | `/api/events` | MQTT | atualizações SSE |
| GET | `/api/health` | quatro storages | readiness real; 503 se houver falha |

## 9. Segurança

- Segredos existem somente em `.env`, que está ignorado pelo Git.
- `.env.example` contém somente nomes de variáveis vazios.
- Nenhuma credencial usa `VITE_*` ou chega ao navegador.
- Erros e logs não imprimem connection strings nem senhas.
- Database, prefixo, tópico e bucket são validados contra o Grupo 4 na inicialização.
- Imagens têm validação de ObjectId, bucket e regex do caminho antes da leitura.
- Não foram executados DROP, DELETE, ALTER, FLUSH, publicação MQTT ou alteração de bucket.

Não havia autenticação de usuário no projeto original; não foi inventado um mecanismo sem requisito. A API publica apenas o dataset sintético do dashboard e mantém as credenciais protegidas.

## 10. Testes

Comandos finais e resultados reais:

```text
npm run typecheck          -> aprovado
npm run lint               -> aprovado
npm run build              -> aprovado (Vite; aviso não impeditivo de chunk > 500 kB)
npm run test:integration   -> 3/3 aprovados contra infraestrutura real
npm run test:e2e           -> 12/12 aprovados (demo e API interceptada)
npm run test:e2e:real      -> 1/1 aprovado, todas as páginas e PNG real
npm audit --omit=dev       -> 4 vulnerabilidades moderadas transitivas no MinIO, sem correção não disruptiva
npm start                  -> aprovado; build e API servidos em 127.0.0.1:3001
```

Execuções intermediárias também foram registradas: o primeiro lint encontrou globals Node ausentes no escopo do ESLint e foi corrigido; o primeiro E2E não iniciou por ausência do Chromium; uma execução posterior apontou a nova requisição SSE não prevista no teste; o primeiro E2E real verificou o PNG antes da decodificação. Todas essas causas foram corrigidas e os comandos finais acima passaram.

## 11. Evidências

- MariaDB: 12 tabelas e 559 linhas totais; seis talhões.
- MongoDB: 87.132 documentos nas quatro collections auditadas.
- Redis: 19 chaves restritas a `grupo4:*`; contador histórico = 81.058.
- MQTT: 17 mensagens reais observadas em 75 s; sete sensores online; ciclos de ~60 s.
- MinIO: 49 objetos; 48 PNGs NDVI + um CSV de solo.
- HTTP real: `/api/health` retornou 200 com MariaDB/MongoDB/Redis/MinIO `true`; cinco coleções de endpoint retornaram arrays válidos; o proxy retornou PNG com assinatura `89 50 4E 47 0D 0A 1A 0A`.
- Produção: `/` retornou HTTP 200 e `text/html`; `/api/talhoes` retornou 6 e `/api/imagens` retornou 48 registros.
- Navegador real: dashboard exibiu 6 talhões e 48 imagens; nove rotas abriram sem estado de erro; imagem MinIO teve `naturalWidth > 0`.
- Build, typecheck, lint, 3 testes reais de API, 12 testes de regressão e 1 teste real de navegador aprovados.

## 12. Pendências

- O schema real não possui estado `online` de máquinas. O card mantém “—/status indisponível” em vez de inferir ou inventar o valor.
- Nenhuma mensagem MQTT de máquina ou alerta ocorreu na janela observada; esses ramos foram implementados a partir dos mesmos schemas reais do MongoDB, mas a evidência ao vivo desta sessão cobre sensores/status.
- As faixas visuais de saúde NDVI continuam explicitamente ilustrativas; não foi fornecido critério agronômico por cultura.
- O repositório não usava Docker e o daemon local estava indisponível; não foi introduzido Compose apenas para alterar a forma de execução.
- `npm audit --omit=dev` aponta quatro avisos moderados transitivos (`decode-uri-component` e `stream-json`) puxados por `minio@8.0.7`. O único reparo automático oferecido usa `--force` e troca para `minio@7.1.3` (breaking change); ele não foi aplicado sem uma migração/teste dedicado.
