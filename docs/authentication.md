# Autenticação e controle de partida

As respostas de login, consulta e atividade de sessão incluem `user: { id, email, username }`. O username vem de `paradox.users`, inclusive ao recarregar uma sessão existente; não é inferido do e-mail. No treino, uma conta controla os dois lados, por isso o mesmo username aparece com os rótulos Viajantes e Guardiões.

Datas de sessão, expiração e reserva usam timestamptz e conexões em UTC. O padrão e a comparação com o Trama estão em [database-dates.md](database-dates.md).

Decisão: e-mail/senha com bcryptjs e pepper; cookie HttpOnly com token opaco, armazenado como hash no banco. Inatividade de 24h, limite absoluto de 7 dias e renovação limitada a 15 minutos. Heartbeats não contam como atividade. Sem manter conectado nesta etapa.

API local em 3002, acessada pela interface em 5173 através do proxy /api. Na Vercel, /api/* é atendido pelo mesmo handler via Vercel Function, mantendo HTTPS e mesma origem. A configuração está em vercel.json e os requisitos de publicação em docs/deployment.md; nenhum deploy remoto foi validado nesta etapa.

| Método e caminho              | Contrato                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| POST /api/v1/session          | E-mail/senha; cria sessão e cookie. Não retorna token.                                |
| GET /api/v1/session           | Identidade e prazos da sessão.                                                        |
| DELETE /api/v1/session        | Revoga sessão, libera sua reserva e apaga cookie.                                     |
| POST /api/v1/session/activity | Renova sessão conforme política; só mediante atividade do usuário.                    |
| GET /api/v1/match             | Estado da partida local da conta, sem conceder controle.                              |
| POST /api/v1/match/control    | tabId e takeover; reserva de 60s, versão para invalidar a aba anterior.               |
| POST /api/v1/match/heartbeat  | tabId e controlVersion; renova somente reserva ainda válida.                          |
| POST /api/v1/match/actions    | tabId, controlVersion, revision, requestId e ação. Validada e aplicada pelo servidor. |

Mutações exigem Origin permitido. Erros retornam code e mensagem curta, sem SQL, senhas ou tokens. Credenciais inválidas retornam resposta genérica. Tentativas de login são limitadas no banco. Cookie próprio paradox_session; Secure em produção, SameSite=Lax, Path=/api. Sem tokens em localStorage.

A reserva é por conta, vinculada à sessão e aba; transações com bloqueio de linha serializam transferências e jogadas. Cada transferência incrementa controlVersion; a aba anterior perde imediatamente a autorização no servidor. Queda/fechamento libera por expiração. requestId evita repetir ações; revision rejeita ações calculadas sobre estado antigo. Menus não exigem reserva.

A primeira versão permanece treino local de uma conta controlando os dois lados, com estado persistido no servidor. Isso não implementa matchmaking ou uma partida competitiva entre duas contas. Sessão expirada exige login novamente; estado fica salvo para retomada. Não há tolerância que estenda autorização após expiração, logout ou revogação.

Contas são criadas pelo comando users:create, lendo nome, username, e-mail e senha da entrada padrão. O padrão de perfil, administração e metadados de verificação de e-mail está em [users-schema.md](users-schema.md). Não existe cadastro público, fluxo de verificação de e-mail, painel administrativo ou recuperação de senha nesta etapa. Pepper é gerado localmente e preservado; perdê-lo invalida a verificação das senhas existentes.
