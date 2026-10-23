# Mesa jogável do observatório

A partida autenticada segue a disposição de Queen’s Blood apresentada pelo usuário: tabuleiro central 3×5, identificadores dos jogadores nas laterais, mão ativa embaixo, mão do lado inativo virada para baixo no topo após a preparação e botão de passar no canto inferior direito. Não há inspeção lateral nem placar geral durante o jogo; os placares por linha permanecem no tabuleiro e o resultado total aparece somente ao encerrar.

A tela usa a altura disponível do navegador para manter tabuleiro e cartas visíveis sem rolagem. Em celular, a mão ocupa uma grade compacta. O treino ainda é de uma conta controlando ambos os lados: o username real da sessão aparece com os rótulos Viajantes e Guardiões. Os emblemas laterais são provisórios. A mão inferior acompanha o jogador da vez; a superior mostra somente a quantidade de cartas do outro lado, sem suas faces.

As novas partidas usam as 145 frentes originais temporárias de Queen’s Blood, com nomes em inglês e o verso do Paradox. A interface permanece em português. As regras e limites estão em [card-rules.md](card-rules.md). As artes anteriores permanecem para partidas já salvas e auxiliares sem imagem original.

## Camadas visuais

- `public/assets/board/observatory-environment.png`: cenário sem controles, cartas, textos ou pontuações, derivado do conceito aprovado por `image_gen` em 22/10/2026.
- `public/assets/board/card-art-atlas.png`: oito ilustrações originais provisórias geradas por `image_gen` na mesma data, em grade 4×2. O mapeamento por identidade fica em `src/presentation/card-art.ts`, compartilhado entre React e Phaser.
- `public/assets/board/card-cutouts.png`: personagens isolados preservados para compatibilidade e auxiliares provisórias.
- `public/assets/cards/*.webp`: 145 frentes originais copiadas sem alteração, com hashes comparados à captura.
- `public/assets/board/card-back.png`: verso recriado por `image_gen` a partir do detalhe do baralho no cenário fornecido pelo usuário, com fundo escuro, ornamentos dourados, astrolábio e ampulheta.
- Phaser desenha casas, frentes das cartas colocadas, cristais de território, prévias e destaque de colocação. Quando o poder efetivo muda, o novo valor aparece sobre a frente original, que permanece intacta.
- React compõe identificadores, mãos, placares acessíveis e controles. A seleção eleva a carta; o destaque de colocação e as transições respeitam movimento reduzido.

A mesa usa perspectiva CSS 3D e inclinação de 20 graus, mantendo o desenho das peças em Phaser 2D. Não é uma cena com malhas e iluminação 3D em tempo real. Mão, verso e carta colocada usam largura física de 120 unidades e altura derivada da imagem original de 390×534. A carta ocupa mais de 90% da largura da casa. A perspectiva altera somente a projeção visual; não há scaleY. As coordenadas ficam ocultas no desenho e preservadas nos rótulos acessíveis.

A composição desktop tem 1440×1040 unidades lógicas. No retrato, os mesmos elementos se reorganizam em 800×1560, sem mudar o tamanho das cartas. Um ResizeObserver mede a área disponível; a escala única é o menor valor entre as razões de largura e altura disponíveis/lógicas. A transformação é aplicada ao contêiner da mesa inteira. Mãos grandes se sobrepõem dentro de suas áreas, em vez de encolher cada carta separadamente.

A geometria das casas é compartilhada em `src/presentation/board-layout.ts`. Botões transparentes sobre cada casa recebem mouse, toque e teclado e acompanham a mesma transformação 3D do desenho. O canvas mantém coordenadas lógicas fixas e escala por CSS; `Scale.FIT` não é usado porque mediria o contêiner já projetado e reduziria o desenho dentro da mesa.

As 145 cartas participam do catálogo do treino, incluindo habilidades especiais. A referência integral do cenário continua em `public/assets/concepts/approved-board.png`; esta implementação segue sua composição, sem afirmar equivalência artística exata ou desempenho medido de 60 fps. A cobertura de regras e as diferenças de referência estão documentadas em card-rules.md.

## Verificação

`e2e/placement.spec.ts` verifica usernames, ausência da inspeção, contagem de cartas ocultas, seleção, casas legais, teclado, mouse, pontuação real, preparação, passes, reinício e movimento reduzido. Também verifica ausência de rolagem e limites das cartas em 1920×1080, 1440×900, 1366×768, 1280×720 e 390×844. Capturas em `test-results/reference-table-*.png` permitem revisão visual. Autenticação e transferência de controle continuam cobertas por `e2e/auth.spec.ts`, exclusivamente no banco de testes.
