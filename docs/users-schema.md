# Padrão da tabela de usuários

A migration standardize-users-schema alinha paradox.users à estrutura de perfil, administração e verificação de e-mail do Trama, preservando a autenticação do jogo.

| Coluna                      | Padrão                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| id                          | UUID, chave primária, default gen_random_uuid()                                                   |
| name                        | varchar(255), obrigatório e não vazio                                                             |
| username                    | varchar(30), obrigatório, único sem diferenciar maiúsculas, letras/números/underscore/ponto/hífen |
| email                       | varchar(254), obrigatório, único sem diferenciar maiúsculas                                       |
| password_hash               | varchar(60), hash bcrypt com pepper; preserva o nome existente                                    |
| created_at                  | timestamptz, obrigatório, default now()                                                           |
| updated_at                  | timestamptz, obrigatório, default now(), atualizado por trigger                                   |
| is_admin                    | boolean, obrigatório, default false                                                               |
| email_verification_required | boolean, obrigatório, default true para novas inserções diretas                                   |
| email_verified_at           | timestamptz, opcional                                                                             |
| email_verification_version  | integer não negativo, obrigatório, default 0                                                      |

Na migração das contas existentes, nome recebe Player, username recebe um identificador gerado, updated_at recebe created_at, is_admin recebe false e a conta fica isenta de verificação, sem ser marcada falsamente como verificada. IDs, e-mails, hashes, created_at e relacionamentos são preservados. Os defaults de nome e username também mantêm compatibilidade com inserções da versão anterior da aplicação. Campos podem ser substituídos por perfis reais em uma futura operação administrativa.

Se houver dados antigos maiores que os novos limites ou e-mails duplicados quando comparados sem distinguir maiúsculas, a migration falha e a transação é revertida; não há truncamento ou exclusão automática.

Ao alterar o e-mail para outro endereço, a trigger limpa email_verified_at, exige nova verificação e incrementa email_verification_version. Mudanças apenas de maiúsculas não invalidam a verificação. Toda atualização de usuário atualiza updated_at em UTC.

users:create solicita nome, username, e-mail e senha. A função administrativa createUser continua compatível com seus chamadores anteriores e rejeita flags de privilégio/verificação fornecidas no perfil. O provisionamento administrativo cria contas comuns isentas da verificação, pois não há cadastro público nesta etapa. Não concede privilégios administrativos nem considera essas contas verificadas.

Os campos de administração e verificação são a fundação do modelo: endpoints administrativos, envio de links, consumo de tokens e bloqueio de login por verificação ainda não foram implementados. Nenhuma permissão nova depende apenas destes metadados nesta etapa.

Uma reversão desta migration remove os novos metadados de perfil/administração/verificação e mantém as colunas originais, os hashes e os relacionamentos. O rollback é testado somente em paradoxcards_test; não executar em produção sem avaliar a perda desses metadados.

As datas seguem [database-dates.md](database-dates.md). O serviço de login e controle de partida continua descrito em [authentication.md](authentication.md).
