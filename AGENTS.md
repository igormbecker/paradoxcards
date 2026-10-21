# Orientações do Paradox Cards

- Desenvolva funcionalidades e correções por TDD: teste, falha esperada, implementação e refatoração com testes verdes.
- Preserve a arquitetura modular: motor TypeScript puro em src/game, coordenação em src/application e apresentação Phaser/React. As regras não dependem da interface.
- Use inglês em identificadores e mensagens de commit. Commits seguem Conventional Commits, validados por commitlint.config.cjs. Ao sugerir um commit, mostre o comando completo com aspas simples.
- Aplique a formatação do Prettier e EditorConfig. A preferência por exemplos compactos na conversa não altera a formatação dos arquivos.
- Antes de concluir, execute lint, verificação de tipos e testes pertinentes; valide o fluxo de navegador quando houver mudanças na interface. Não declare CI remoto ou desempenho de 60 fps validados sem evidência.
- Execute Node, npm e Git no Ubuntu/WSL desta pasta. A versão de Node fica em .nvmrc.
- Preserve alterações existentes. Não faça commit ou push sem autorização que cubra a ação.
- As decisões de produto e visual estão em docs e no AI-Memory; as cartas atuais são provisórias.

- Ambiente reproduzível: Node e npm exatos definidos em .nvmrc e package.json. Use nvm install, nvm use e npm run setup em uma nova máquina. Preserve .npmrc, lockfile e versões exatas; npm run check executa a validação local básica. Não atualize engines sem revisar e validar o conjunto.
