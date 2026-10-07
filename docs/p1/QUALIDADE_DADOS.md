# Qualidade dos dados

## Resultado

Não foi possível avaliar a qualidade dos dados reais da fazenda porque nenhum banco, collection, tópico, bucket, chave ou dataset real foi localizado/acessado.

Não foram declarados problemas de duplicidade, completude, validade, consistência, integridade ou temporalidade, pois isso exigiria inventar resultados.

| Problema | Serviço | Como foi detectado | Registros afetados | Impacto | Tratamento proposto |
|---|---|---|---:|---|---|
| Base real indisponível para auditoria | ambiente do projeto | busca integral do repositório, daemon Docker indisponível e portas usuais fechadas | não mensurável | impede diagnóstico de qualidade e decisão final de escopo | fornecer acesso somente leitura e executar perfilamento reproduzível |

## Limitações verificadas no contrato provisório

Os itens abaixo são riscos do **cliente**, não problemas comprovados nos dados reais:

- `src/services/adapters.ts` rejeita datas fora do formato aceito e NDVI fora de `[-1, 1]`.
- Campos obrigatórios variam por recurso; valores ausentes fazem o recurso inteiro falhar no carregamento atual.
- IDs de imagens e alertas podem ser sintetizados pelo índice quando `id`/`_id` está ausente. Isso pode ser instável com paginação/reordenação.
- O cliente não verifica duplicidade nem integridade referencial entre talhões, imagens, leituras e alertas.
- O README informa que paginação e contrato reais ainda não foram validados.

## Roteiro de medição pendente

Quando os serviços forem disponibilizados, registrar para cada teste: comando exato, resultado bruto resumido, total da base, afetados, percentual e impacto. Os testes devem cobrir:

1. chaves/IDs duplicados;
2. nulos, strings vazias e campos ausentes;
3. domínios documentados, sem impor limites agronômicos não validados;
4. referências entre entidades/serviços;
5. timestamps ausentes, repetidos, fora de ordem e intervalos anormais;
6. unidades e identificadores divergentes entre bases.

`INFORMAÇÃO NÃO LOCALIZADA — REQUER CONFIRMAÇÃO DO GRUPO`: total e percentual afetados por qualquer problema real.

