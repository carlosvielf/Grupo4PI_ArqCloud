# Auditoria do projeto — P1

> Auditoria executada em 07/10/2026. Este documento separa fatos verificados de propostas. Dados em `src/mocks/data.ts` são fictícios e não representam a fazenda.

## Visão geral

O repositório contém um frontend SPA chamado **Monitora.G4**, implementado em React 19, TypeScript e Vite. A própria documentação do projeto afirma que o workspace original não continha backend nem modelos de dados e que o frontend atual foi criado com dados de demonstração.

Não foram localizados Dockerfiles, arquivos Compose, código de backend, migrations, SQL, CSV, JSONL, BSON, seeds de banco ou configurações de MariaDB, MongoDB, Redis, MQTT e MinIO.

## Preservação e estado Git

| Verificação | Resultado real |
|---|---|
| Branch | `main` |
| Rastreamento | `main...origin/main` |
| Alterações antes da auditoria | nenhuma (`git status --short` sem saída) |
| Branches encontradas | `main`, `origin/main` |
| Commits encontrados | `9a5be69`, `7fd5246`, `20d3c71` |
| Autor Git observado | Carlos Viel; isto não comprova, isoladamente, participação acadêmica |
| Remote | `https://github.com/carlosvielf/Grupo4PI_ArqCloud.git` |

Nenhum código-fonte ou dado foi alterado durante a auditoria. Foram adicionados apenas os documentos em `docs/p1/`.

## Estrutura relevante

```text
.
├── .agents/skills/          # instruções auxiliares, não parte da aplicação
├── docs/                    # validação anterior e capturas do frontend
├── public/demo/             # 18 SVGs procedurais de demonstração
├── scripts/                 # gerador dos SVGs demonstrativos
├── src/
│   ├── components/          # layout, UI, gráficos e componentes de domínio
│   ├── hooks/               # provider de dados
│   ├── mocks/               # dados explicitamente fictícios
│   ├── pages/               # nove páginas/rotas
│   ├── services/            # cliente HTTP e adaptadores provisórios
│   ├── App.tsx
│   └── types.ts             # contrato provisório da interface
├── tests/                   # testes Playwright com API interceptada
├── .env.example             # somente configuração pública do Vite
├── package.json
├── playwright.config.ts
├── README.md
└── vite.config.ts
```

## Tecnologias e dependências verificadas

- React 19, React DOM e React Router DOM 7.
- TypeScript 5.8 e Vite 6.3.
- Recharts para gráficos e Lucide React para ícones.
- Playwright e Axe para testes de navegador/acessibilidade.
- DM Sans fornecida por pacote local.

## Aplicação e fluxo de execução

O modo padrão é `demo`. O fluxo comprovado em código é:

```text
Páginas React
  -> FarmProvider (src/hooks/useFarmData.tsx)
  -> loadFarmData (src/services/api.ts)
  -> import dinâmico de src/mocks/data.ts
  -> componentes e gráficos
```

Existe um caminho configurável para API, mas nenhum endpoint é fornecido:

```text
Páginas React
  -> FarmProvider
  -> fetch HTTP com cookie, timeout de 15 s
  -> caminhos VITE_API_* preenchidos pelo operador
  -> adaptadores provisórios
  -> componentes
```

Esse segundo fluxo é capacidade de integração, não evidência de backend existente. Nos testes, `/api/*` é interceptado pelo Playwright e não corresponde a serviço real.

## Rotas existentes

`/`, `/talhoes`, `/talhoes/:id`, `/imagens`, `/analises`, `/alertas`, `/maquinas`, `/telemetria` e `/configuracoes`.

## Inventário de infraestrutura encontrada

| Serviço | Tecnologia | Container | Porta interna | Porta externa | Volume | Origem da configuração | Finalidade comprovada |
|---|---|---|---|---|---|---|---|
| Frontend | React/Vite | não definido | não aplicável | 5173 em desenvolvimento; 4173 em preview | nenhum | `package.json`, `vite.config.ts`, `README.md` | interface demonstrativa e cliente HTTP configurável |
| MariaDB | não localizado | não localizado | não localizado | não localizado | não localizado | nenhuma | não comprovada |
| MongoDB | não localizado | não localizado | não localizado | não localizado | não localizado | nenhuma | não comprovada |
| Redis | não localizado | não localizado | não localizado | não localizado | não localizado | nenhuma | não comprovada |
| MQTT | não localizado | não localizado | não localizado | não localizado | não localizado | nenhuma | não comprovada |
| MinIO | não localizado | não localizado | não localizado | não localizado | não localizado | nenhuma | não comprovada |

## Validação do ambiente

- `docker version`: cliente 29.8.0 localizado; servidor indisponível.
- `docker ps`, `docker volume ls` e `docker network ls`: falharam porque `//./pipe/docker_engine` não existe e o arquivo de configuração do Docker não pôde ser lido neste ambiente.
- Portas locais verificadas e fechadas: 3306, 27017, 6379, 1883, 8883, 9000, 9001, 5173, 5174 e 4173.
- Processos com nomes Docker, MariaDB/MySQL, MongoDB, Redis, Mosquitto, MinIO ou Node: nenhum localizado.
- Node e npm: não localizados no `PATH` nem em `C:\Program Files\nodejs`; por isso os testes atuais não puderam ser reexecutados.
- Evidência anterior em `docs/VALIDACAO.md`: em 06/10/2026, build, lint, typecheck e 12 testes Playwright foram registrados como aprovados. Trata-se de documentação preexistente, não de execução desta auditoria.

## Configuração e credenciais

Somente `.env.example` foi localizado. Ele contém `VITE_DATA_SOURCE` e URLs/caminhos públicos de API, todos vazios salvo o modo `demo`. `.env` e `.env.local` são ignorados pelo Git e não estavam presentes.

A busca por nomes comuns de segredos nos arquivos do projeto rastreados (excluindo lockfile e skills) não encontrou ocorrências. Isso não é uma auditoria criptográfica. Variáveis `VITE_*` são incorporadas ao cliente e não podem conter segredos.

## Situação e riscos

1. A entrega baseada em dados reais está bloqueada pela ausência do backend, configurações e datasets.
2. O frontend oferece funcionalidades orientadas a talhões, NDVI, imagens, alertas e máquinas, mas usa dados fictícios por padrão.
3. Os tipos e adaptadores são explicitamente provisórios; não constituem schema de banco.
4. Não é possível confirmar fazenda, número do grupo, integrantes, RAs ou arquitetura da plataforma de dados.
5. Não é possível medir volume, período ou qualidade dos dados reais.
6. Não há configuração de containerização no repositório.

## Informações ausentes

`INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` para: nome da fazenda, número oficial do grupo, lista de integrantes, RAs, credenciais/endpoints de leitura, Compose/Dockerfiles, schemas, bancos, collections, tópicos, buckets, chaves Redis, volumes, redes, portas reais e contrato da API.

