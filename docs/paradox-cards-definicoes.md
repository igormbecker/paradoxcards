# Paradox Cards — definições do projeto

**Data:** 20 de outubro de 2026.  
**Status:** decisões iniciais aceitas; implementação ainda não iniciada.  
**Finalidade:** registro compartilhável para consulta e publicação no AI-Memory.

## Visão e objetivo

Paradox Cards será um jogo de cartas por turnos para navegador, com as mesmas regras e mecânicas de Queen’s Blood, de Final Fantasy VII Rebirth. Terá nomes, ilustrações, ambientação e apresentação próprios, com temática de eras e viagem no tempo inspirada na atmosfera de Chrono Trigger.

O usuário não deseja modificar regras ou balanceamento para diferenciar o projeto. As mudanças pretendidas são temáticas e visuais.

## Fidelidade às regras e às 145 cartas

Preservar o funcionamento original de:

- Tabuleiro de três linhas por cinco colunas.
- Preparação normal, baralhos de 15 cartas, mão inicial, mulligan e compra.
- Turnos, colocação, passes e encerramento.
- Controle territorial, ranks de peões, expansão e captura.
- Pontuação por linha e resultado final, incluindo exceções das habilidades.
- Fortalecimento, enfraquecimento, destruição, substituição e geração de cartas.
- Condições, duração, gatilhos e ordem de resolução dos efeitos.

Cada uma das **145 cartas colecionáveis** terá uma correspondente no Paradox Cards, preservando exatamente:

1. Rank ou condição de substituição.
2. Poder base.
3. Padrão de expansão territorial.
4. Alcance da habilidade.
5. Efeito, valores e alvos.
6. Condições de ativação, duração e limites de repetição.
7. Interações e recursos auxiliares gerados.

Alterar apenas nome, arte, era e descrição narrativa. Manter uma tabela de correspondência entre a carta original e a versão do Paradox Cards. Identificadores como `PC-001` foram sugeridos; o formato definitivo ainda pode ser ajustado.

Cartas auxiliares geradas por habilidades também precisam de equivalentes funcionais, embora não integrem as 145 cartas colecionáveis numeradas.

Não introduzir bônus de facção, novos recursos, alterações de atributos ou restrições adicionais de baralho sem nova decisão explícita do usuário.

## Eras e facções temáticas

| Era                   | Identidade                                        | Afinidade sugerida para distribuir cartas |
| --------------------- | ------------------------------------------------- | ----------------------------------------- |
| Era Primitiva         | Criaturas antigas, natureza, pedra e força física | Poder bruto e cartas simples              |
| Era Medieval          | Cavaleiros, magos, fortalezas e ordens            | Fortalecimento e apoio por posicionamento |
| Era Futurista         | Máquinas, autômatos e tecnologia                  | Controle do tabuleiro e enfraquecimento   |
| Fim dos Tempos        | Entropia, sombras e entidades temporais           | Destruição, sacrifício e substituição     |
| Era Perdida ou Mítica | Civilizações antigas e fenômenos extraordinários  | Cartas raras, geração e efeitos especiais |

Essas afinidades orientam a ambientação, sem alterar as habilidades para encaixar cartas em uma era. Cartas de diferentes eras podem ser misturadas no mesmo baralho, respeitando as regras originais.

A distribuição das 145 cartas, o nome definitivo da última era e os nomes individuais estão pendentes. A direção discutida prevê personagens, criaturas, lugares, símbolos e ilustrações próprios, usando Chrono Trigger como referência de atmosfera temporal.

## Plataforma e arquitetura

**Direção técnica aceita:** começar pelo navegador, usando **TypeScript + Phaser + React**, com **Vite** para desenvolvimento e build.

| Tecnologia | Responsabilidade                                             |
| ---------- | ------------------------------------------------------------ |
| TypeScript | Motor de regras, modelos de cartas e estado da partida       |
| Phaser     | Mesa de jogo, interação visual, animações e efeitos          |
| React      | Menus, coleção, montagem de baralhos e interfaces auxiliares |
| Vite       | Ambiente de desenvolvimento e preparação da aplicação web    |

A recomendação inicial de React para toda a interface evoluiu para Phaser na mesa após a definição de um acabamento visual mais elaborado.

Separar o motor de regras da apresentação: o cálculo de uma jogada não deve depender de animações ou componentes visuais. Isso facilita testes de habilidades, reprodução de partidas e criação de adversários controlados pelo computador.

Caso seja implementado multiplayer online, o servidor deverá validar as jogadas. Backend, hospedagem, autenticação e infraestrutura ainda não foram escolhidos.

A proposta é priorizar a experiência no navegador de computador e considerar toque e telas menores no desenho da interface. Aplicativos nativos e distribuição em lojas não foram definidos.

## Direção visual e sonora

**Referência principal de acabamento:** [Queen’s Blood Online](https://www.queensbloodonline.com/).

O usuário quer um jogo bonito, com efeitos próximos à qualidade dessa referência, aplicado à identidade temporal do Paradox Cards.

Foi possível observar a página inicial do site: cenário escuro, textura de tabuleiro, iluminação suave, profundidade e detalhes dourados. A partida estava atrás do login; suas animações internas não foram observadas. Os efeitos abaixo representam a direção proposta e aceita na conversa, não uma descrição verificada dos efeitos daquele site.

- Tabuleiro com texturas, sombras, iluminação e profundidade.
- Cartas que se elevam ao selecionar e se deslocam suavemente até a casa escolhida.
- Sensação de impacto ao colocar cartas.
- Energia e animações para expansão, captura e surgimento de peões.
- Alterações de poder com números animados e feedback claro.
- Fortalecimento com brilho, enfraquecimento com distorção e destruição com desintegração.
- Portais, partículas e cores relacionadas às eras.
- Efeitos sonoros sincronizados com compra, colocação, captura e habilidades.

Os efeitos devem preservar a leitura do tabuleiro e representar os resultados do motor, sem alterar a mecânica. Estilo final das ilustrações, tipografia, paleta, molduras, trilha e recursos de áudio ainda estão pendentes.

## Primeiro marco de desenvolvimento

Foi aceita a proposta de começar com **uma pequena partida visualmente bem acabada**, usando cartas provisórias e efeitos representativos, antes de produzir as artes de toda a coleção.

Um conjunto menor no protótipo é uma etapa de desenvolvimento, não uma redução da meta final de equivalência das 145 cartas.

A sequência sugerida anteriormente foi: protótipo local, conjunto inicial de cartas, adversário controlado pelo computador, identidade visual completa e multiplayer online. Essa sequência é uma proposta de execução; modos de jogo, entregas e cronograma detalhados ainda precisam ser definidos.

## Material de referência existente

Guia original ampliado:

`C:/Users/dieig/Downloads/queens_blood_guia.md`

Contém regras, estratégias, exemplos, modalidades e um catálogo com 145 cartas numeradas de 001 a 145: nome original, rank/colocação, poder base, habilidade em português, obtenção e links de consulta.

Cópia anterior à inclusão do catálogo:

`C:/Users/dieig/Downloads/queens_blood_guia.antes_catalogo.bak`

Manter o guia como referência original, separado da futura identidade das cartas do Paradox Cards. Esses caminhos são locais; outro agente ou ambiente precisará receber também o arquivo de referência para consultar seu conteúdo.

### Limitações conhecidas

- O guia é independente e não é um regulamento oficial.
- A presença das 145 fichas foi conferida; isso não equivale à validação integral dos dados no jogo.
- As grades exatas de expansão e habilidade ainda não foram transcritas: estão nas fichas visuais externas vinculadas.
- Foram encontradas divergências entre catálogos públicos; os dados precisam de revisão antes de serem tratados como especificação executável.
- Ordem de efeitos, auras, destruições encadeadas e casos extremos precisam de confirmação prática.
- As cartas auxiliares geradas ainda não possuem um catálogo completo de atributos e grades no Markdown.

Essas lacunas não são decisões de simplificar o jogo. A intenção permanece reproduzir as mecânicas com exatidão; falta completar e validar a referência.

## Pendências e próximos passos

1. Conferir atributos e habilidades das 145 cartas.
2. Registrar todas as grades de expansão e alcance.
3. Documentar auxiliares e a ordem precisa de resolução das interações.
4. Estruturar os dados e a correspondência com as cartas do Paradox Cards.
5. Definir o conjunto e o escopo da primeira partida demonstrável.
6. Implementar o motor separado da interface e verificar seus comportamentos.
7. Validar o acabamento visual com cartas provisórias.
8. Distribuir as cartas entre eras e desenvolver nomes e artes próprios.
9. Definir os modos de jogo e a infraestrutura online.

## Estado e compartilhamento

O guia de referência foi criado e ampliado, e este documento registra a direção do produto. Ainda não há implementação do jogo, dados completos de alcance, artes finais ou infraestrutura escolhida.

Este arquivo está preparado para compartilhamento no AI-Memory. Sua criação no projeto não significa que já tenha sido publicado na memória.
