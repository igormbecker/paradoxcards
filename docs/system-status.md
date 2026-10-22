# Status do sistema

A página pública `/status` adapta a consulta de infraestrutura do Trama à identidade do Paradox. O acesso fica no rodapé da página inicial. Mantém as fontes existentes, a floresta ao fundo com contraste reduzido, títulos dourados e indicadores ciano.

## Contrato

`GET /api/v1/status` não requer sessão. Retorna `Cache-Control: private, no-store`.

- `200`: `status: "operational"`, `updated_at` em ISO UTC e `dependencies.database` com `version`, `max_connections` e `opened_connections`.
- `503`: `status: "unavailable"`, `updated_at` e `dependencies.database: null` quando a consulta falha. Não inclui mensagens internas de erro.
- Outros métodos: `405`, com `Allow: GET`.

Uma consulta SQL lê versão, limite e conexões do banco atual (`current_database()`). A conexão usa a configuração própria do Paradox. Não retorna nomes de banco, usuários, hosts, tokens ou dados das contas. A leitura não altera dados e a conexão é encerrada pelo adaptador existente. A consulta tem timeout de 3 segundos; a abertura de conexão mantém os limites do adaptador de banco.

`/api/health` continua sendo apenas a verificação de processo existente. O status operacional aqui confirma a consulta ao PostgreSQL, não todas as funcionalidades, integrações ou a disponibilidade externa do domínio.

## Comportamento da página

Faz uma consulta ao entrar, repete 5 segundos após cada consulta e oferece verificação manual. Não sobrepõe requisições e cancela a consulta ao sair. O navegador limita cada tentativa a 8 segundos. Rejeita payloads sem o formato esperado e apresenta indisponibilidade em falhas de rede, respostas inválidas ou falha do banco.

Métricas anteriores não permanecem como saudáveis após falha. A última atualização é exibida em português, no horário de Brasília. O JSON preserva o timestamp UTC retornado pela API. A barra mostra a quantidade de conexões em relação ao limite do servidor; em hospedagem com pooler, esse limite não representa necessariamente a cota comercial do serviço.

O diagnóstico consulta apenas o PostgreSQL do ambiente atual. Testes completos de navegador usam exclusivamente `paradoxcards_test` por meio da configuração Playwright existente. A rota `/status` é reescrita para `index.html` na configuração de hospedagem, preservando as rotas `/api/*`.

## Validação

`infra/status.test.ts` verifica o contrato público, cache, falha sanitizada e rejeição de escrita. `e2e/status.spec.ts` verifica a leitura real no banco de testes, navegação, layout em computador/celular, recuperação de falha e descarte de métricas antigas após uma falha posterior.
