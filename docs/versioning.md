# Versão no rodapé

O rodapé obtém a versão durante o build, a partir de `git describe --tags --match 'v[0-9]*' --long --dirty`. O formato de tag reconhecido é `vMAJOR.MINOR.PATCH`, opcionalmente com pré-lançamento.

- Sem tag alcançável no histórico, ou sem Git/metadados disponíveis: `Em desenvolvimento`.
- Exatamente no commit de uma tag, com árvore limpa: `Em desenvolvimento: v0.0.1`.
- Commits posteriores: `Em desenvolvimento: v0.0.1+3.gabc1234`.
- Alterações não commitadas: sufixo `+working` na própria tag ou `.dirty` após os metadados dos commits posteriores.

O navegador não consulta a API do GitHub. A versão corresponde às tags disponíveis no checkout que gerou o site; o ambiente de build precisa disponibilizar as tags e o histórico correspondente. Depois de criar ou buscar uma tag, reinicie o servidor de desenvolvimento ou gere um novo build para atualizar o texto. Não existe sincronização automática de novas tags remotas.

Na implementação inicial não há tags locais ou remotas. Nenhuma tag, release, commit ou push foi criado por esta alteração. A versão `0.1.0` de `package.json` permanece separada das tags e não é usada como versão publicada.
