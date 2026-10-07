# Consultas e evidências

## Evidências realmente executadas em 07/10/2026

### E01 — Estado do repositório

**Objetivo:** preservar alterações existentes.  
**Serviço:** Git.  
**Comando:** `git branch --show-current; git status --short; git status --branch --porcelain=v1`  
**Resultado:** branch `main`; `## main...origin/main`; nenhuma alteração listada.  
**Interpretação:** o trabalho iniciou em árvore limpa.  
**Seções:** auditoria e matriz de evidências.

### E02 — Inventário de arquivos

**Objetivo:** localizar código, infraestrutura e datasets.  
**Serviço:** filesystem/Git.  
**Comandos:** `rg --files -g '!**/.git/**'` e `git ls-tree -r --name-only HEAD`.  
**Resultado:** frontend React, mocks, testes, documentação e skills; nenhum Compose, Dockerfile, SQL, CSV, JSONL ou BSON.  
**Interpretação:** a infraestrutura de dados não está versionada neste repositório.  
**Seções:** estudo de dados e arquitetura atual.

### E03 — Docker

**Objetivo:** reutilizar ambiente existente sem recriá-lo.  
**Serviço:** Docker.  
**Comandos:** `docker version`, `docker ps --all`, `docker volume ls`, `docker network ls`.  
**Resultado:** cliente 29.8.0; daemon inacessível em `//./pipe/docker_engine`; aviso de acesso ao arquivo de configuração.  
**Interpretação:** containers, volumes e redes não puderam ser inventariados via Docker.  
**Seções:** auditoria e arquitetura atual.

### E04 — Portas locais

**Objetivo:** verificar serviços ativos sem escrever dados.  
**Serviço:** TCP local.  
**Comando:** tentativa `TcpClient.ConnectAsync` com timeout de 500 ms por porta.  
**Resultado:** 3306, 27017, 6379, 1883, 8883, 9000, 9001, 5173, 5174 e 4173 fechadas.  
**Interpretação:** nenhum dos serviços esperados estava acessível localmente nas portas verificadas.  
**Seções:** estudo de dados e auditoria.

### E05 — Configurações e datasets

**Objetivo:** localizar fontes persistidas.  
**Serviço:** filesystem.  
**Comando:** busca recursiva por `.env*`, Compose, Dockerfile, `*.sql`, `*.csv`, `*.jsonl` e `*.bson`, excluindo `.git` e `node_modules`.  
**Resultado:** somente `.env.example`.  
**Interpretação:** não há configuração local de banco nem dataset nos formatos pesquisados.  
**Seções:** estudo e qualidade.

### E06 — Serviços em código

**Objetivo:** descobrir menções a tecnologias, endpoints e domínio.  
**Serviço:** código.  
**Comando:** `rg -n -i "mariadb|mysql|mongo|redis|mqtt|minio|..."`.  
**Resultado:** referências de integração no README e código de frontend; nenhum cliente de banco/MQTT/MinIO.  
**Interpretação:** menção documental não comprova uso real.  
**Seções:** arquitetura atual.

### E07 — Segredos rastreados

**Objetivo:** detectar indícios óbvios sem divulgar valores.  
**Serviço:** Git.  
**Comando:** `git grep` por nomes comuns de password/secret/token/key, excluindo lockfile e skills.  
**Resultado:** nenhuma ocorrência nos arquivos de projeto rastreados.  
**Interpretação:** nenhum indício nominal simples; análise não substitui scanner especializado.  
**Seções:** segurança e arquitetura proposta.

### E08 — Build e testes atuais

**Objetivo:** validar o frontend.  
**Serviço:** Node/npm.  
**Comandos:** `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`.  
**Resultado:** todos falharam antes da execução porque `npm.cmd` não foi encontrado; Node/npm também não existem em `C:\Program Files\nodejs`.  
**Interpretação:** não houve revalidação nesta auditoria. `docs/VALIDACAO.md` registra validação anterior em 06/10/2026.  
**Seções:** auditoria e pendências.

## Consultas de negócio exigidas

Nenhuma consulta MariaDB, MongoDB, Redis, MQTT ou MinIO foi executada porque não existe serviço acessível/configurado. Não há resultado real a registrar, e não foram criados nomes fictícios de tabelas, collections, tópicos, chaves ou buckets.

Para concluir a P1, o grupo deve fornecer, de modo seguro:

- endereço/ambiente e mecanismo de acesso somente leitura;
- schemas e propósito de cada serviço;
- período esperado, se documentado;
- autorização para observar tópicos MQTT sem publicar;
- inventário de buckets sem download massivo.

Somente então devem ser produzidas pelo menos cinco consultas analíticas com resultados e interpretações.

## Matriz de evidências

| Evidência | Origem | Comando/arquivo | Resultado resumido | Utilizada na seção |
|---|---|---|---|---|
| E01 | Git | status/branch | árvore inicialmente limpa | auditoria |
| E02 | repositório | `rg --files`, `git ls-tree` | apenas frontend e mocks | dados, arquitetura |
| E03 | Docker | version/ps/volume/network | daemon indisponível | infraestrutura |
| E04 | TCP | `TcpClient` | portas verificadas fechadas | serviços |
| E05 | filesystem | busca por configs/datasets | somente `.env.example` | dados |
| E06 | código | `rg` temático | sem integrações reais | arquitetura |
| E07 | Git | busca nominal de segredos | sem ocorrências | credenciais |
| E08 | toolchain | comandos npm | npm ausente | validação |
| E09 | frontend | `src/services/api.ts` | demo padrão; API configurável | arquitetura atual |
| E10 | mocks | `src/mocks/data.ts` | dataset explicitamente fictício | separação demo/real |
| E11 | histórico | `git log --all` | três commits e um autor observado | grupo/repositório |
| E12 | documentação | `README.md`, `docs/VALIDACAO.md` | integração real pendente | relatório inteiro |

