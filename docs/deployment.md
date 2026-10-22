# Preparação de production e preview

Status: API adaptada para Vercel Functions e migrations automáticas configuradas. Projeto Vercel, bancos Neon, DNS, segredos e deploy ainda não verificados. Nenhuma migration remota foi executada durante a preparação.

## Variáveis na Vercel

Cadastre cada ambiente separadamente. Nunca importe .env.development ou .env.test.

| Variável                 | Production                                                                                  | Preview                                               |
| ------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| DATABASE_URL             | URL pooled do Neon de produção                                                              | URL pooled de um banco Neon exclusivo de preview      |
| DATABASE_URL_UNPOOLED    | URL direta do mesmo banco de produção                                                       | URL direta do mesmo banco de preview                  |
| PASSWORD_PEPPER          | Segredo aleatório exclusivo, mínimo 32 caracteres                                           | Outro segredo aleatório exclusivo                     |
| APP_ORIGINS              | https://playparadox.com.br e outros domínios efetivamente associados, separados por vírgula | Opcional; VERCEL_URL autoriza a URL do próprio deploy |
| RESEND_API_KEY           | Chave restrita ao envio no domínio do jogo                                                  | Chave separada para preview                           |
| EMAIL_FROM               | Paradox Cards <notificacoes@playparadox.com.br> após verificar o domínio                    | Remetente verificado                                  |
| EMAIL_PREVIEW_RECIPIENTS | Não necessário                                                                              | E-mails permitidos separados por vírgula              |

VERCEL_ENV e VERCEL_URL são fornecidas pela plataforma. Não configure NODE_ENV=preview: o build de preview também é de produção para o Node. Nenhum segredo usa prefixo VITE_. O pepper deve permanecer estável para preservar a verificação das senhas do respectivo banco.

As duas URLs de cada ambiente devem apontar para o mesmo banco. Preview nunca deve apontar para produção nem para recursos do Trama. O adaptador valida o host Neon e usa TLS com verificação do certificado, removendo opções SSL da URL que poderiam sobrescrever essa configuração. A API utiliza DATABASE_URL; as migrations utilizam exclusivamente DATABASE_URL_UNPOOLED, rejeitando endpoints pooled. Confirme que ambas apontam para o mesmo banco antes de publicar.

## Resend

Adicionar playparadox.com.br no Resend, configurar os registros DNS fornecidos pelo serviço e aguardar verificação. Criar as chaves e cadastrá-las diretamente na Vercel, sem colá-las no chat. O módulo atual apenas valida configuração: não envia e-mails e ainda não aplica a allowlist a envios. A implementação futura do envio deverá exigir essa lista em preview, como no Trama. Cadastro público e recuperação de senha continuam fora desta etapa.

## Build e publicação

O vercel.json usa Vite, saída dist, API em api/index.ts e rewrite de /api/* para a mesma função. O handler é compartilhado com o servidor local; as regras continuam em src/game. O estado durável continua no PostgreSQL. A função não abre uma porta nem depende de memória entre chamadas. O IP é lido do x-forwarded-for sobrescrito pela Vercel apenas no ambiente Vercel; servidores locais usam o endereço do socket.

O comando build:vercel primeiro compila e depois aplica migrations para frente, com transação e advisory lock. Falhas impedem a conclusão do build. Migrations já aplicadas não são revertidas se uma fase posterior do deploy falhar; adicione migrations compatíveis com a versão anterior da aplicação. Reverter um deploy também não reverte o banco. Não há endpoint HTTP para aplicar migrations.

A região da função é gru1 (São Paulo), próxima aos bancos Neon informados em AWS sa-east-1. Caso os bancos sejam movidos, revise regions no vercel.json.

A Vercel oferece Node 24.x com patches gerenciados. O instalador exclusivo da Vercel verifica a versão principal, usa npm 11.19.1 e desabilita engine-strict apenas no processo de instalação na plataforma. .nvmrc, .npmrc, engines e lockfile locais permanecem preservados. A compatibilidade com a versão de patch efetivamente usada na nuvem deve ser confirmada no primeiro preview.

Na tela de importação, manter Vite, raiz ./ e nome playparadox. Remover EXAMPLE_NAME. Cadastrar as variáveis separadamente para Production e Preview. Não usar as mesmas credenciais nos dois ambientes nem importar arquivos locais. Vercel lê os comandos de instalação e build do vercel.json.

Antes do primeiro deploy: disponibilizar esta branch no GitHub, verificar o domínio no Resend, criar os bancos Neon e cadastrar as variáveis. As contas continuam provisionadas administrativamente; não existe cadastro público. Nenhuma conta de desenvolvimento será copiada para a nuvem. Publicação e credenciais remotas ainda precisam ser configuradas e verificadas.

## Verificação local

npm run check valida lint, tipos, testes e build sem migrations remotas. npm run test:database, npm run test:auth e npm run test:auth:deployment usam apenas paradoxcards_test na porta 5435; o último reutiliza toda a suíte de autenticação pelo handler de deploy e verifica o cookie Secure. npm run test:e2e cobre os fluxos de navegador. Os testes unitários do runner de deploy usam dependências simuladas, sem acessar o Neon. Isso não substitui a validação do roteamento e TLS no primeiro preview real.

Referências: [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js), [node-postgres TLS](https://node-postgres.com/features/ssl), [Resend](https://resend.com/docs/api-reference/emails/send-email), [versões Node na Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
