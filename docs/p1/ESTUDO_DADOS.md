# Estudo dos dados

## Regra de leitura deste documento

Nenhum dado real da fazenda foi localizado ou acessado. Os registros de `src/mocks/data.ts` são rotulados no próprio código como temporários e fictícios. Eles são inventariados separadamente apenas para explicar o comportamento atual da interface e **não atendem** às contagens exigidas para os dados do grupo.

## 1. MariaDB

| Item | Resultado |
|---|---|
| Configuração/código | não localizado |
| Serviço acessível | não; porta local 3306 fechada |
| Databases, tabelas e colunas | `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` |
| Contagem e período | impossível consultar |
| Finalidade real | não comprovada |

Tentativas seguras: busca de arquivos SQL/Compose/Dockerfile e teste TCP em `127.0.0.1:3306`. Não havia cliente/credenciais/schema que permitissem consultas como `SHOW TABLES`.

## 2. MongoDB

| Item | Resultado |
|---|---|
| Configuração/modelos | não localizados |
| Serviço acessível | não; porta local 27017 fechada |
| Databases e collections | `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` |
| Documentos, campos e período | impossível consultar |
| Finalidade real | não comprovada |

Referências a MongoDB no README são recomendações de isolamento do storage, não evidência de instância ou collection.

## 3. Redis

| Item | Resultado |
|---|---|
| Configuração/código | não localizado |
| Serviço acessível | não; porta local 6379 fechada |
| Chaves, tipos e TTLs | `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` |
| Finalidade real | não comprovada |

## 4. MQTT

| Item | Resultado |
|---|---|
| Broker/configuração | não localizado |
| Serviço acessível | não; portas locais 1883 e 8883 fechadas |
| Tópicos, QoS e mensagens | `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` |
| Publishers/subscribers | não comprovados |

## 5. MinIO

| Item | Resultado |
|---|---|
| Configuração/SDK | não localizado |
| Serviço acessível | não; portas locais 9000 e 9001 fechadas |
| Buckets, objetos e metadata | `INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO` |
| Finalidade real | não comprovada |

O README descreve URLs de imagem que idealmente seriam assinadas por uma API. Isso é orientação de integração, não prova de MinIO em uso.

## Dataset demonstrativo — não usar como dado da fazenda

| Estrutura de interface | Quantidade derivada do código | Período demonstrativo | Evidência |
|---|---:|---|---|
| Talhões | 6 | sem data própria | vetor `codes` com 6 elementos |
| Imagens | 48 | 05/06/2026 a 25/09/2026 | 6 códigos × 8 datas |
| Leituras NDVI | 48 | 05/06/2026 a 25/09/2026 | matriz 6 × 8 |
| Alertas | 4 | 24/09/2026 a 25/09/2026 | array literal |
| Telemetria | 20 | 25/09/2026, 08:00–16:00 (UTC−03) | 4 máquinas × 5 horários |
| SVGs procedurais | 18 arquivos | não aplicável | `public/demo/field-*.svg` |

Esses números permitem testar a interface, mas não responder perguntas sobre uma propriedade real.

## Perguntas de negócio

Nenhuma pergunta sobre a fazenda pode ser respondida com evidência real neste estado do repositório. Após o acesso aos serviços, devem ser escolhidas perguntas somente depois de descobrir os schemas. Candidatas condicionais, caso os campos realmente existam: evolução temporal de uma medição por entidade, distribuição de eventos e cobertura temporal de objetos. Elas não são requisitos confirmados.

## Consultas analíticas obrigatórias

As cinco consultas de negócio exigidas pela P1 **não puderam ser executadas**. Não há serviço ativo, endereço remoto, credencial de leitura ou dataset real. Consultas SQL/NoSQL não são apresentadas com nomes inventados. A lacuna deve ser resolvida antes da entrega final.

