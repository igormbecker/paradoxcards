# Paradox Cards

Jogo de cartas por turnos para navegador. Motor TypeScript independente, mesa em Phaser, interface React e build com Vite. Desenvolvimento com TDD.

## Preparar em outra máquina

Requisitos: Git, Docker com Compose e Node.js **24.22.1**, com npm **11.19.1**. Execute Node, npm e Git no Ubuntu/WSL; no Windows, use o editor conectado ao WSL.

Com o [nvm](https://github.com/nvm-sh/nvm) já instalado, no terminal Ubuntu/WSL:

```bash
git clone https://github.com/igormbecker/paradoxcards.git
cd paradoxcards
nvm install
nvm use
npm run setup
npm run dev
```

Antes do primeiro login, crie uma conta em outro terminal do projeto (com nvm use):

```bash
npm run users:create
```

Informe nome, username, e-mail e senha no próprio terminal; a senha não é mostrada nem passada como argumento. O comando precisa do banco iniciado e das migrations aplicadas, como `npm run dev` já faz. Não há conta padrão com senha compartilhada. O login permanece por e-mail e senha.

Abra [localhost:5173](http://localhost:5173). Para parar, use Ctrl+C. O Docker precisa estar ativo. O setup cria `.env.development` e `.env.test` a partir dos exemplos sem sobrescrever arquivos existentes. O desenvolvimento local não exige Neon, Vercel ou chave do Resend.

`npm run setup` executa `npm ci` e prepara os arquivos de ambiente: instala exatamente o package-lock.json e ativa o hook do Husky. Pode ser repetido após baixar mudanças no lockfile. Ele substitui node_modules, sem alterar arquivos do jogo. Para adicionar dependências, use `npm install nome-do-pacote`; a opção save-exact preserva versões exatas.

A configuração completa descrita aqui precisa estar no GitHub para ser obtida por um clone. Alterações locais não são publicadas automaticamente.

## Versões e editor

- `.nvmrc`: versão exata do Node, também lida pelo GitHub Actions.
- `package.json`: engines de Node/npm, packageManager e versões exatas das dependências.
- `.npmrc`: impede instalação com engines incompatíveis e salva dependências sem intervalos de versão.
- `package-lock.json`: versões transitivas para instalação reproduzível.
- `.editorconfig` e `.gitattributes`: dois espaços, UTF-8 e finais de linha LF.
- `.vscode`: Prettier ao salvar, ESLint e TypeScript local, com extensões recomendadas.

Mudanças de versão são deliberadas: atualize a configuração, reinstale e execute os checks. Não use comandos de atualização forçada como rotina de instalação.

## Comandos

```bash
npm run dev              # Banco, espera, migrations, API em 3002 e interface em 5173
npm run check            # Formatação, lint, tipos, testes Vitest e build
npm run setup:e2e        # Instala Chromium e bibliotecas do sistema (pode pedir sudo)
npm run test:database    # Prepara o banco isolado e verifica migrations e esquema de users
npm run test:auth        # Integração de autenticação e controle de partida
npm run test:auth:deployment # Mesma suíte pelo handler de deploy, usando o banco local de teste
npm run test:e2e         # Inicia API/interface próprias para os testes de navegador
npm run preview          # Visualiza o build estático; não inicia a API
```

Para conferir tudo numa máquina nova, depois de `npm run setup`, execute:

```bash
npm run check
npm run test:database
npm run test:auth
npm run test:auth:deployment
npm run setup:e2e
npm run test:e2e
```

`check` não inicia Docker nem aplica migrations remotas. Os testes Vitest não precisam de banco ou navegador. Os testes de autenticação e Playwright dependem do banco preparado por `test:database`; não reutilizam o banco de desenvolvimento.

Também disponíveis: `npm test`, `npm run typecheck`, `npm run lint`, `npm run lint:prettier:check`, `npm run lint:prettier:fix` e `npm run lint:eslint:check`.

## PostgreSQL e migrations

Mesmos pacotes de infraestrutura do Trama: pg 8.23.1, node-pg-migrate 9.0.0, dotenv 18.0.5, dotenv-expand 1000.0.0 e async-retry 1.3.3. PostgreSQL 16 Alpine fixado por digest no Compose. Atualizações da imagem devem ser deliberadas e testadas.

- Desenvolvimento: localhost:5434, banco paradoxcards_dev, volume persistente próprio.
- Testes: localhost:5435, banco paradoxcards_test, armazenamento temporário separado.
- Não utiliza containers, volumes ou portas do Trama.
- A configuração de deploy usa Vercel Functions e Neon, com bancos separados para Production e Preview; veja [deploy](docs/deployment.md).
- Credenciais dos exemplos são apenas locais. Arquivos .env reais ficam fora do Git; nunca use prefixo VITE_ para senhas.

```bash
npm run services:up                  # Inicia somente o banco de desenvolvimento
npm run services:wait:database       # Aguarda a conexão, com prazo limitado
npm run migrations:up                # Aplica migrations pendentes
npm run migrations:create -- create-cards
npm run migrations:down              # Reverte a última migration; pode remover dados
npm run test:database                # Testa consultas e migrations no banco isolado
npm run services:stop                # Para os serviços, preservando dados de desenvolvimento
npm run services:down                # Remove containers e rede; preserva o volume de desenvolvimento
npm run dev:client                   # Inicia apenas a interface, sem depender do banco
```

Ctrl+C em `npm run dev` encerra API e interface; o banco continua ativo até `services:stop` ou `services:down`. Não use `down -v` para parar o projeto: isso exclui volumes.

Migrations ficam em `infra/migrations`, usando CommonJS (`.cjs`) para compatibilidade com o CLI dentro deste projeto ESM. Elas criam o schema `paradox`, contas, sessões, limites de login, partidas persistidas e recibos de ações, além da padronização de usuários. As migrations aplicadas ficam registradas em `pgmigrations`. Não edite uma migration já compartilhada/aplicada: crie a próxima.

Datas usam `timestamptz`, defaults `now()` e conexões configuradas em UTC. A tabela `users` inclui nome, username, datas de criação/atualização e metadados de administração/verificação de e-mail, preservando `password_hash` para o bcrypt com pepper. Consulte [datas do banco](docs/database-dates.md) e [esquema de usuários](docs/users-schema.md).

A camada Node-only em infra/database.mjs fornece query parametrizada e getNewClient. Não importe essa camada na interface ou no motor. O estado da partida de treino é persistido por conta no PostgreSQL e as ações são validadas pela API. O catálogo ainda é provisório em código, sem editor ou coleção persistente. A API Node em infra/server integra autenticação e ações do protótipo com o motor puro; o cliente nunca importa pg.

O CI também roda `test:database` com Docker. Os testes verificam consulta parametrizada, up, idempotência, down, reaplicação, preservação de contas, restrições de perfil, atualização de metadados e comportamento de datas entre fusos, exclusivamente no banco `paradoxcards_test`.

## Deploy na Vercel e Neon

O projeto está preparado para Vite na raiz, saída `dist` e API em `api/index.ts`. O rewrite de `/api/*` mantém interface e API na mesma origem. A função está configurada para São Paulo (`gru1`), próxima dos bancos Neon em AWS `sa-east-1`.

A Vercel executa o instalador próprio em `infra/scripts/install-vercel.mjs`: exige Node 24.x, instala com a versão exata de npm do projeto e permite os patches de Node gerenciados pela plataforma apenas nesse processo. As exigências exatas do ambiente local permanecem intactas.

O comando `npm run build:vercel` compila o projeto e depois aplica migrations pendentes com conexão direta, transação e advisory lock. Se a configuração, conexão ou migration falhar, o build para. Reverter um deploy não reverte o banco; migrations precisam permanecer compatíveis com a versão anterior da aplicação.

Cadastre as variáveis no projeto Vercel, selecionando o ambiente correspondente:

| Variável                   | Production                                                        | Preview                                                             |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`             | URL pooled do banco de produção                                   | URL pooled do banco de preview                                      |
| `DATABASE_URL_UNPOOLED`    | URL direta do mesmo banco de produção                             | URL direta do mesmo banco de preview                                |
| `PASSWORD_PEPPER`          | Segredo exclusivo com pelo menos 32 caracteres                    | Outro segredo exclusivo com pelo menos 32 caracteres                |
| `APP_ORIGINS`              | Origens HTTPS permitidas, separadas por vírgula e sem barra final | Opcional; autoriza automaticamente a URL do deploy por `VERCEL_URL` |
| `RESEND_API_KEY`           | Chave de envio do domínio                                         | Preferencialmente outra chave para preview                          |
| `EMAIL_FROM`               | `Paradox Cards <contato@playparadox.com.br>`                      | Mesmo remetente verificado                                          |
| `EMAIL_PREVIEW_RECIPIENTS` | Não necessário                                                    | E-mails permitidos separados por vírgula                            |

Para o domínio do projeto, `APP_ORIGINS` de Production deve incluir `https://playparadox.com.br,https://www.playparadox.com.br` quando ambos estiverem associados. `VERCEL` e `VERCEL_ENV` são fornecidas pela plataforma; não configure `NODE_ENV=preview`. Cada ambiente precisa de suas próprias credenciais e pepper. Não importe os arquivos `.env` locais na Vercel e não exponha segredos com prefixo `VITE_`.

O domínio é `playparadox.com.br`, registrado no Registro.br, com configuração de DNS encaminhada à Vercel. Os registros DNS de verificação do Resend pertencem ao domínio; as chaves de API pertencem às variáveis de ambiente do projeto. O código valida a configuração do Resend, mas ainda não envia e-mails. Usar `contato@playparadox.com.br` como remetente não cria uma caixa de entrada.

Se o build falhar com `PASSWORD_PEPPER_REQUIRED`, a variável está ausente ou tem menos de 32 caracteres no ambiente do deploy; essa validação ocorre antes da conexão com o Neon. Após corrigir a variável no ambiente correspondente, use **Redeploy** na Vercel; não é necessário um commit vazio. Valide deploy, conexão Neon e DNS no ambiente remoto. Os testes locais e do GitHub Actions não comprovam essas integrações.

O diagnóstico de deploy informa a fase e um código seguro. Não publica credenciais, URLs de banco, SQL ou stack traces. Consulte [o guia de deploy](docs/deployment.md) para detalhes e limites.

## Estado do protótipo

Você controla os dois lados. Cada lado usa um baralho fixo de 15 cartas provisórias, com até duas cópias por identidade. A mão inicial de cinco é sorteada com seed por partida. Há troca inicial única por jogador, compra, turnos, prévia, expansão, captura e placares por linha e geral. Dois passes consecutivos encerram; jogar reinicia a contagem. O catálogo atual também permite reconhecer automaticamente quando nenhum lado possui qualquer jogada possível, considerando mãos e baralhos. Substituições e outras habilidades futuras precisam ser consideradas nessa verificação.

O resultado conta apenas a força das linhas vencidas; empates não pontuam. Ainda sem equivalência validada das cartas originais, habilidades, editor de baralho ou IA. Arte provisória; direção final registrada em docs. Meta de 60 fps ainda sem medição.

## Arquitetura e qualidade

Motor em `src/game`, coordenação em `src/application`, mesa em `src/presentation/phaser` e composição React em `src/main.tsx`. Testes do motor ficam ao lado do código; testes de navegador em `e2e`.

A configuração de qualidade segue a base do Trama, adaptada para TypeScript + React + Vite. Husky e Commitlint validam Conventional Commits no commit-msg; não há execução automática de testes no pre-commit. `npm run commit` abre o assistente Commitizen.

```bash
git commit -m 'chore: configure reproducible development environment'
```

GitHub Actions executa sete jobs em pull requests: `lint`, `typecheck`, `commitlint`, `unit tests`, `integration tests`, `build` e `e2e`. A integração inclui o handler de deploy com banco local de teste. A configuração não cria proteção de branch nem aplica migrations no Neon.

Use uma branch de trabalho para alterações e commits; não faça commits diretamente na `main`. Trabalhos relacionados podem continuar na mesma branch. Commit e push exigem autorização.

Limitação conhecida: o build avisa sobre um chunk maior que 500 kB, relacionado ao bundle do jogo com Phaser. Isso não impede a compilação e não comprova desempenho em execução. Atualizações de dependências e correções de auditoria devem ser avaliadas e validadas deliberadamente.

Se migrations funcionarem com nvm use mas falharem em outro terminal, confira node -v. Cada terminal mantém sua própria versão do Node. Os comandos de desenvolvimento e migrations verificam a versão antes de executar; a configuração engine-strict restringe a instalação, mas não troca a versão do terminal automaticamente.

## Login, sessão e várias abas

Consulte [autenticação](docs/authentication.md) para os endpoints e regras. API local em 3002; navegador em 5173, com proxy de mesma origem. `npm run dev` inicia os dois processos e encerra ambos com Ctrl+C; o PostgreSQL permanece ativo. Reinicie `npm run dev` após atualizar os comandos de execução.

Sessão: 24h de inatividade, 7 dias de limite absoluto, renovação a cada 15 minutos de atividade. Cookie HttpOnly e token armazenado como hash no banco. O pepper é gerado pelo setup nos arquivos .env, sem sobrescrever o existente. Preserve esse segredo em mudanças de máquina para manter válidas as senhas de contas transportadas; sem ele será necessário redefini-las.

A partida aceita uma aba de controle por conta. Reserva de 60s renovada a cada 15s, com transferência explícita e bloqueio imediato das ações antigas no servidor. Abas sem controle podem visualizar a mesa. Nova aba ou recarregamento pode exigir Continuar nesta aba; não se usa localStorage para tokens. A autenticação expirada pausa o controle e permite entrar novamente para retomar o estado salvo.

Playwright usa portas 5174/3003 e exclusivamente o banco de testes. Nenhuma conta de teste é criada no desenvolvimento. Cadastro público, envio e consumo de verificação de e-mail, painel administrativo, recuperação de senha, matchmaking e multiplayer competitivo ainda não estão implementados. Os campos de administração e verificação de `users` preparam o modelo, sem conceder privilégios ou implementar esses fluxos. Produção exige HTTPS e `APP_ORIGINS` explícito.
