# Escopo do sistema web

## Condição para definição final

Não existe base factual suficiente para escolher funcionalidades de produção: o único dataset é fictício e os contratos são provisórios. Portanto, as propostas abaixo são **condicionais** e não devem ser apresentadas como escopo validado da fazenda.

## Propostas consideradas

| Proposta | Dados necessários | Evidência atual | Dificuldade/risco | Decisão |
|---|---|---|---|---|
| A. Integrar e reduzir o Monitora.G4 às fontes reais | pelo menos um recurso real com período e identificador | frontend e adaptadores provisórios existem; fonte real ausente | média; maior risco é contrato desconhecido | recomendada após acesso aos dados |
| B. Dashboard de NDVI e imagens | talhões, leituras NDVI e URLs de imagens reais | apenas mocks | média; alto risco de não existirem esses dados | não aprovar ainda |
| C. Painel de máquinas e alertas | telemetria e eventos reais | apenas mocks | média; alto risco de ausência de telemetria | não aprovar ainda |

### Recomendação

A melhor relação entre utilidade e viabilidade é a proposta A: primeiro conectar **somente os recursos realmente descobertos**, remover telas sem fonte e entregar um recorte vertical pequeno. Se nenhum dado real for fornecido, o produto só poderá ser apresentado honestamente como protótipo demonstrativo, não como sistema da fazenda.

## Persona, problema e objetivo — provisórios

- **Persona:** `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO`.
- **Problema comprovado:** os dados reais não estão conectados ao frontend existente.
- **Objetivo técnico proposto:** permitir consulta segura e rastreável de um conjunto real de dados, após confirmar usuário e necessidade.

## Requisitos funcionais candidatos

Nenhum RF de negócio está confirmado. A tabela mantém rastreabilidade e explicita dependências.

| ID | Requisito candidato | Usuário | Dados necessários | Serviço de origem |
|---|---|---|---|---|
| RF01 | Exibir o estado de disponibilidade de cada recurso configurado | usuário a confirmar | resultado das requisições HTTP | frontend/API configurada; backend não localizado |
| RF02 | Listar registros do primeiro recurso real aprovado | a confirmar | contrato real paginado | a descobrir |
| RF03 | Filtrar registros somente por campos realmente existentes | a confirmar | campos e domínios validados | a descobrir |
| RF04 | Abrir detalhe com os campos autorizados do registro | a confirmar | identificador estável e payload real | a descobrir |
| RF05 | Informar indisponibilidade sem substituir dados por mocks | a confirmar | status/erro HTTP | frontend já possui comportamento parcial |

RF02–RF04 permanecem bloqueados até a auditoria das fontes. As páginas atuais não são RFs confirmados.

## Requisitos não funcionais candidatos

| ID | Requisito |
|---|---|
| RNF01 | Não expor credenciais em variáveis `VITE_*` ou no bundle do navegador. |
| RNF02 | A API deve mediar acesso a bancos e object storage; o navegador não se conecta diretamente a eles. |
| RNF03 | Preservar estados de carregamento, vazio, erro e recuperação já existentes. |
| RNF04 | Manter navegação por teclado, foco visível e layout responsivo já registrados na validação anterior. |
| RNF05 | Registrar erros por recurso sem substituir falhas por dados fictícios. |
| RNF06 | Definir metas de desempenho/disponibilidade somente após medir volume e ambiente reais. |

## Telas candidatas do MVP

Para limitar o MVP a 3 telas, reaproveitar componentes existentes e substituir nomes apenas após descobrir o recurso real.

### 1. Estado das fontes

Objetivo: mostrar quais recursos configurados responderam. Origem: resultado das chamadas HTTP do frontend. Ações: atualizar. Não exibe segredos.

```text
+----------------------------------------------------+
| Estado das fontes                         [Atualizar]|
+----------------------------------------------------+
| Recurso A       disponível/erro      última consulta|
| Recurso B       não configurado       —              |
+----------------------------------------------------+
```

### 2. Lista do recurso aprovado

Objetivo: consultar registros reais após validação do schema. Componentes: busca/filtros apenas para campos existentes, tabela ou cartões, paginação do servidor. Origem: API/backend a localizar.

```text
+----------------------------------------------------+
| Registros reais                                    |
| [busca se suportada] [filtros confirmados]          |
+----------------------------------------------------+
| campo real | campo real | data real | [detalhar]    |
+----------------------------------------------------+
|                         [anterior] 1 [próxima]       |
+----------------------------------------------------+
```

### 3. Detalhe do registro

Objetivo: mostrar um registro e, se comprovado, sua série/objetos relacionados. Origem: API/backend a localizar.

```text
+----------------------------------------------------+
| < Voltar              Identificador real            |
+----------------------------------------------------+
| Campos existentes e autorizados                     |
| Relações comprovadas (se houver)                     |
| Série temporal/arquivo somente se a fonte existir   |
+----------------------------------------------------+
```

## Rastreabilidade tela → dado → serviço

| Tela | Informação apresentada | Serviço de origem | Estrutura | Evidência |
|---|---|---|---|---|
| Estado das fontes | configuração pública e erro/sucesso por recurso | frontend | `endpointConfig`, `ResourceIssue` | `src/services/api.ts`, `src/pages/Configuracoes.tsx` |
| Lista do recurso aprovado | a definir após acesso | `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` | a descobrir | ainda sem evidência |
| Detalhe do registro | a definir após acesso | `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` | a descobrir | ainda sem evidência |

As duas últimas telas são propostas condicionais. Nenhuma informação sem origem comprovada deve ser implementada.

