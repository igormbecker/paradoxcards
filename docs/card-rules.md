# Catálogo temporário e habilidades

As 145 cartas de `docs/reference/queens-blood/cards.json` estão disponíveis ao treino, sem excluir as que têm habilidades. `src/game/reference-data.ts` preserva nomes em inglês, rank, poder, expansão, casas de efeito, texto da habilidade e caminho da imagem. `reference-cards.ts` associa definições executáveis aos textos preservados. Texto não reconhecido falha explicitamente; não vira uma carta sem habilidade silenciosamente.

As frentes em `public/assets/cards` são cópias integrais das 145 referências. Um teste compara os hashes e os dados com a captura. O verso continua sendo o do Paradox. As oito identidades anteriores permanecem legíveis em partidas já salvas; reiniciar a mesa cria uma partida com o novo catálogo.

## Partidas de treino

Cada lado recebe quinze cartas distintas escolhidas do catálogo completo. Sete são de rank 1 e a distribuição inicial contém pelo menos duas delas, para permitir a abertura. A seleção é determinística pela semente da partida. Esta composição automática é provisória; não é um editor de baralhos nem uma reprodução dos decks de NPCs.

As regras permanecem no motor TypeScript puro, compartilhado pela prévia e pela execução servidora. O cliente continua enviando somente a ação, índices e os controles de revisão/reserva. Os dados de carta enviados pelo navegador não definem o resultado da jogada.

## Resolução implementada

- Colocação por rank e substituição de uma carta aliada ocupante.
- Expansão e casas de habilidade independentes, espelhadas para o jogador da direita.
- Mudanças de poder e destruição imediatas, auras contínuas, crescimento por colocação/destruição, bônus derivados de cartas melhoradas/enfraquecidas, primeiro aprimoramento/enfraquecimento e limiar de poder de Cloud.
- Gatilhos de destruição, efeitos em cadeia, poder herdado em substituições e geração de cartas na mão.
- Criação de Diamond Dust, Elementals e variantes de Hype Johnnys nas posições próprias vazias, sem tratá-las como cartas jogadas da mão.
- Bônus de linha e transferência dos pontos da linha perdedora por Ultimate Party Animal, calculados depois de determinar o vencedor da linha.

Poder impresso, modificador permanente e poder efetivo são separados. Auras são recalculadas, sem acumular o bônus a cada atualização. Contagens derivadas observam poder impresso mais modificadores e auras, sem contar seu próprio bônus recursivamente. Gatilhos únicos são registrados por instância. A fila resolve os efeitos e recalcula as auras até estabilizar; uma oscilação de efeitos contínuos é rejeitada em vez de travar o servidor.

## Auxiliares e limites da referência

As dezessete definições auxiliares em `src/game/tokens.ts` vêm da transcrição observacional em [Final Fantasy Wiki:Sandsea](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Wiki:Sandsea). Não fazem parte das 145 colecionáveis e não entram no sorteio. Elemental e Diamond Dust usam o rank da posição que os gerou. As imagens dessas auxiliares não estavam na coleção salva; por enquanto recebem a apresentação provisória do Paradox com nome e atributos próprios.

A captura principal é do site não oficial Queen’s Blood Online. Ela diverge de outras transcrições em alguns pontos, como o momento de ativação de Cockatrice. Nesta implementação prevalece o contrato já salvo no projeto; o material original não foi reescrito para esconder a divergência. As áreas de Hype Johnnys na fonte auxiliar também são observacionais. Os testes demonstram o comportamento implementado, não equivalência integral com todas as interações de FFVII Rebirth. Revisão das diferenças e testes de combinações continuam necessários antes de considerar o conjunto definitivo.

Os testes cobrem atributos e imagens das 145 cartas, famílias de efeitos, imutabilidade, espelhamento, bônus, auxiliares e oitenta partidas com sementes fixas. A reserva por aba e a persistência seguem os testes autenticados existentes, exclusivamente no banco de testes.
