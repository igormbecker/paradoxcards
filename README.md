# Paradox Cards

Jogo de cartas por turnos para navegador. Motor TypeScript independente, mesa em Phaser, interface React e build com Vite. Desenvolvimento com TDD.

## Preparar em outra máquina

Requisitos: Git e Node.js **24.22.1 LTS**, com npm **11.19.1**. O ambiente validado é Ubuntu/WSL; no Windows, prefira o VS Code conectado ao WSL. O Node também pode ser instalado nativamente, respeitando as versões indicadas.

Com o [nvm](https://github.com/nvm-sh/nvm) já instalado, no terminal Ubuntu/WSL:

```bash
git clone https://github.com/igormbecker/paradoxcards.git
cd paradoxcards
nvm install
nvm use
npm run setup
npm run dev
```

Abra [localhost:5173](http://localhost:5173). Para parar, use Ctrl+C. Não há banco, Docker, conta externa, chave de API ou arquivo .env obrigatório nesta etapa.

`npm run setup` executa `npm ci`: instala exatamente o package-lock.json e ativa o hook do Husky. Pode ser repetido após baixar mudanças no lockfile. Ele substitui node_modules, sem alterar arquivos do jogo. Para adicionar dependências, use `npm install nome-do-pacote`; a opção save-exact preserva versões exatas.

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
npm run dev              # Desenvolvimento em localhost:5173
npm run check            # Formatação, lint, tipos, testes do motor e build
npm run setup:e2e        # Instala Chromium e bibliotecas do sistema (pode pedir sudo)
npm run test:e2e         # Testes de navegador; inicia o Vite se necessário
npm run preview          # Visualiza o build já gerado
```

Para conferir tudo numa máquina nova, execute setup, check, setup:e2e e test:e2e nessa ordem. Os testes do motor não precisam do navegador instalado.

Também disponíveis: `npm test`, `npm run typecheck`, `npm run lint`, `npm run lint:prettier:check`, `npm run lint:prettier:fix` e `npm run lint:eslint:check`.

## Estado do protótipo

Você controla os dois lados. Cada lado usa um baralho fixo de 15 cartas provisórias, com até duas cópias por identidade. A mão inicial de cinco é sorteada com seed por partida. Há troca inicial única por jogador, compra, turnos, prévia, expansão, captura e placares por linha e geral. Dois passes consecutivos encerram; jogar reinicia a contagem. O catálogo atual também permite reconhecer automaticamente quando nenhum lado possui qualquer jogada possível, considerando mãos e baralhos. Substituições e outras habilidades futuras precisam ser consideradas nessa verificação.

O resultado conta apenas a força das linhas vencidas; empates não pontuam. Ainda sem equivalência validada das cartas originais, habilidades, editor de baralho ou IA. Arte provisória; direção final registrada em docs. Meta de 60 fps ainda sem medição.

## Arquitetura e qualidade

Motor em `src/game`, coordenação em `src/application`, mesa em `src/presentation/phaser` e composição React em `src/main.tsx`. Testes do motor ficam ao lado do código; testes de navegador em `e2e`.

A configuração de qualidade segue a base do Trama, adaptada para TypeScript + React + Vite. Husky e Commitlint validam Conventional Commits no commit-msg; não há execução automática de testes no pre-commit. `npm run commit` abre o assistente Commitizen.

```bash
git commit -m 'chore: configure reproducible development environment'
```

GitHub Actions executa checks de formatação, ESLint, tipos, commits, testes, build e navegador em pull requests após publicação dos workflows. A configuração não cria proteção de branch.

Limitação conhecida: o npm audit aponta dependências de desenvolvimento do Commitizen; isso não faz parte do bundle do jogo. Avalie correções compatíveis antes de atualizar essas ferramentas.
