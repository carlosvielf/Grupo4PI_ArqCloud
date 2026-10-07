# Plano até a P2 — 17/11/2026

## Premissas

O plano parte do estado auditado em 07/10/2026. O maior bloqueio é obter fontes reais. Datas posteriores à descoberta são condicionais; não se deve implementar telas adicionais com mocks como substituto silencioso.

## Cronograma

| Período | Prioridade | Entrega | Dependência |
|---|---|---|---|
| 07–09/10 | P0 | confirmar grupo, fazenda, integrantes/RAs e responsável pelos dados | grupo/professor |
| 07–13/10 | P0 | obter inventário, Compose/configuração e acesso somente leitura | responsável pela infraestrutura |
| 12–16/10 | P0 | executar consultas reais, contagens, períodos e perfilamento de qualidade | acesso aos serviços |
| 15–19/10 | P0 | escolher um caso de uso e congelar contrato/escopo de 3 telas | resultados da auditoria |
| 20–27/10 | P1 | implementar backend monolítico mínimo e testes de contrato | schema real |
| 26/10–03/11 | P1 | integrar frontend, autenticação e tratamento de erros | API funcional |
| 02–07/11 | P1 | paginação/filtros estritamente necessários e validação com usuário | dados representativos |
| 06–11/11 | P1 | testes integrados, segurança, acessibilidade e observabilidade básica | ambiente integrado |
| 10–13/11 | P1 | correções e documentação operacional | resultados de testes |
| 14–16/11 | P0 | ensaio, evidências finais e congelamento da entrega | sistema estável |
| 17/11 | P0 | entrega P2 | aprovação do grupo |

Se o acesso real não estiver disponível até 13/10, o risco de prazo deve ser escalado imediatamente e o professor deve validar se um protótipo demonstrativo é aceitável.

## Backlog

1. Confirmar metadados acadêmicos.
2. Inventariar serviços/dados com contas de leitura.
3. Executar e registrar pelo menos cinco consultas úteis.
4. Medir problemas de qualidade.
5. Validar persona e problema.
6. Reduzir o frontend às fontes existentes.
7. Implementar API modular, autenticação e acesso privilegiado somente no servidor.
8. Integrar três telas.
9. Testar contrato, falhas parciais, segurança, responsividade e acessibilidade.
10. Atualizar relatório e evidências.

## Divisão de tarefas

A quantidade e os nomes dos integrantes não foram localizados. As linhas abaixo são pacotes a atribuir; não pressupõem número de pessoas.

| Integrante | Responsabilidade | Entregas |
|---|---|---|
| INTEGRANTE A DEFINIR | dados e infraestrutura | inventário, acessos, consultas e contagens |
| INTEGRANTE A DEFINIR | backend e segurança | API, autenticação, secrets e testes de contrato |
| INTEGRANTE A DEFINIR | frontend e acessibilidade | integração das três telas e estados de erro/vazio |
| INTEGRANTE A DEFINIR | qualidade e entrega | perfilamento, testes E2E, documentação e apresentação |

Após confirmar a equipe, distribuir pacotes considerando disponibilidade e revisão cruzada; uma pessoa não deve aprovar sozinha sua própria evidência crítica.

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| dados/serviços continuam indisponíveis | P1 e escopo sem evidência | prazo P0 para acesso e escalada ao professor |
| contrato real difere dos adapters | retrabalho | teste de contrato antes da UI |
| volume exige paginação | lentidão/incorreção de totais | medir primeiro e paginar no servidor |
| credenciais no frontend | exposição | secrets apenas no backend |
| excesso de telas existentes | prazo e baixa qualidade | limitar MVP a 3 telas comprovadas |

## Definição de pronto

- fatos rastreáveis a comandos/arquivos;
- cinco ou mais consultas reais com resultado e interpretação;
- problemas de qualidade medidos, ou ausência demonstrada por consultas;
- nenhuma tela sem fonte comprovada;
- contrato e testes aprovados;
- credenciais ausentes do Git/bundle;
- build, lint, typecheck e E2E executados no ambiente final;
- documentação e apresentação revisadas por outro integrante.

