# Referência das cartas originais

Captura em 21 de outubro de 2026 da página de decks de Queen’s Blood Online:
https://www.queensbloodonline.com/decks/

## Conteúdo

- `cards.json`: 145 cartas, identificadas de `qb-001` a `qb-145`.
- `catalog.html`: galeria local pesquisável, com imagens, atributos, habilidades e diagramas. Abre diretamente no navegador e funciona sem conexão.
- `images/`: 145 imagens de referência preservadas, com hashes SHA-256 no JSON.
- `original-numbers.json`: referência auxiliar de numeração; os nomes são normalizados por `build-catalog.py`.
- `acquire.py`: baixa as imagens a partir dos identificadores observados na página.
- `build-catalog.py` e `build-gallery.py`: reproduzem os arquivos a partir das transcrições e imagens preservadas; requerem Python e Pillow.

A página mostrava 137 cartas disponíveis e nove cartas distintas no deck, com Riot Trooper em ambos. A união contém as 145 cartas. Nenhuma carta foi adicionada ou removida do deck para fazer a coleta.

## Campos e coordenadas

`id` é nosso identificador estável de referência, baseado em `originalNumber`, a numeração original. Não é um ID interno do servidor do site. `nameEn` preserva o nome original para correspondência futura; não define o nome da adaptação.

`power` é o poder base. `rank` é a exigência de peões; `rank: 0` e `placementType: "replacement"` identificam cartas que substituem uma aliada, e não cartas livremente colocáveis em qualquer casa vazia.

Cada carta ocupa **uma única casa**, a origem `[0, 0]`. `expansionOffsets` lista casas cujo território/rank é afetado pelo posicionamento. `effectOffsets` lista casas afetadas pela habilidade. Estes conjuntos são distintos e podem se sobrepor.

Offsets são `[linha, coluna]`: linha positiva para baixo, coluna positiva para a direita, na perspectiva do jogador da esquerda. Para o jogador da direita, espelhar a coluna. Não recortar os padrões à altura do tabuleiro ao armazená-los: offsets de duas linhas são válidos e podem sair da mesa dependendo da origem.

`pattern5x5` preserva o diagrama completo: `O` origem, `R` expansão, `E` efeito, `B` ambos, `.` sem marcação. A expansão foi identificada pelo preenchimento dourado; o efeito, pela borda vermelha. Os padrões foram extraídos das imagens preservadas. Poder e rank foram lidos visualmente; todos os poderes também foram comparados com modelos dos dígitos das próprias imagens.

`abilityTextEn` transcreve o tooltip do site, inclusive erros de escrita. Não é uma implementação executável da habilidade. `verification` registra a procedência e o limite de cada dado.

## Fontes e limites

A fonte principal é um site não oficial. A captura representa esse site; não valida automaticamente equivalência com FFVII Rebirth, eventuais alterações de balanceamento, ordem de resolução ou exceções de regras. Nenhuma habilidade foi implementada no motor por esta coleta.

A numeração e os nomes originais foram cruzados com:
https://www.powerpyx.com/final-fantasy-7-vii-rebirth-all-queens-blood-card-locations/

Há uma divergência de nome registrada: o site usa `Levikron`, enquanto a referência original usa `Levrikon` (#007). O JSON mantém `nameEn: "Levrikon"`, `sourceNameEn: "Levikron"` e o slug da imagem sem modificá-lo.

As imagens são referências de terceiros, não as artes finais do Paradox. Os dados ficam em `docs/reference`, separados dos recursos publicados e das cartas provisórias do motor.

Cartas auxiliares geradas por habilidades **não estão incluídas nas 145 colecionáveis**. Para equivalência completa, ainda é necessário catalogar Mandragora Minion, Heatseeker Minion, Grangalan Junior e descendentes, Resurrected Amalgam, Moogle, The Tiny Bronco, Galian Beast, Diamond Dust, Elementals, Moogle Mage, Moogle Bard, Cacneo, Donberry e Hype Johnnys, incluindo variantes e habilidades próprias. Os textos preservados apontam essas dependências; não inventar seus atributos.

Antes da adaptação, revisar as regras contra o jogo original e preencher essas dependências. Manter a correspondência individual; trocar nomes, narrativa e artes sem alterar a mecânica validada.
