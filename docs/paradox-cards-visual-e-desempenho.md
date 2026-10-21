# Paradox Cards — visual aprovado, renderização 2D e meta de desempenho

**Status:** accepted  
**Data:** 20 de outubro de 2026.

## Contexto

Este registro complementa [[decisions/paradox-cards-definicoes]]. Após a publicação das definições iniciais, foi gerada uma imagem conceitual da partida. O usuário aprovou explicitamente sua aparência (“Vamos bater o martelo desta forma”) e confirmou a abordagem de imagens em camadas com profundidade visual. Solicitou registrar esses acordos no AI-Memory.

## Decisão

### Referência visual aprovada

O mockup gerado passa a ser o alvo artístico do Paradox Cards: mesa em um observatório temporal, cenário escuro e detalhado, pedra e metal envelhecido, ornamentação dourada, sombras, iluminação atmosférica e energia ciano. A composição inclui tabuleiro 3×5, mão de cartas na parte inferior, inspeção lateral da carta selecionada, placares por linha e botão de passar.

As cartas apresentam ilustrações próprias e molduras com identidade por era. A seleção deve ter elevação e brilho; movimentos, partículas, captura, mudanças de poder e destruição devem oferecer feedback legível. Preservar a composição e a atmosfera do conceito ao produzir os componentes reais.

**Imagem preservada no projeto:** `docs/assets/paradox-cards-conceito-aprovado.png`.  
**Documento local desta decisão:** `docs/paradox-cards-visual-e-desempenho.md`.

A imagem é uma ilustração raster estática, não uma captura de implementação. Não contém camadas separadas, animações funcionais ou objetos 3D. Nomes, atributos, padrões, posições e placares ilustrativos não são dados validados nem substituem a especificação mecânica. A aprovação é da direção visual.

### Abordagem gráfica

Implementar em **2D com profundidade visual**, mantendo TypeScript + Phaser + React + Vite.

- Cenário e decoração como imagens detalhadas em camadas.
- Grande parte das sombras e iluminação do ambiente incorporada às artes.
- Cartas, textos, atributos, sombras móveis e destaques como elementos separados.
- Animações de posição, escala e inclinação para produzir sensação de presença.
- Partículas e efeitos pontuais para energia temporal, fortalecimento, enfraquecimento e destruição.
- A mesa e seus efeitos animados ficam no Phaser; menus, coleção e montagem de baralhos ficam no React.
- O motor de regras permanece independente da apresentação.

Não é necessário construir todo o observatório e a mesa como uma cena 3D em tempo real. A referência deve ser reconstruída em componentes; a ilustração completa sozinha não constitui a interface jogável.

### Meta de desempenho

Adotar **60 fps como meta**, com foco inicial no navegador de computador em Full HD (1920×1080). É uma meta a validar, não uma garantia para todo dispositivo ou um resultado já medido.

A 60 fps, cada quadro tem aproximadamente 16,7 ms de orçamento. O hardware mínimo, navegadores de suporte e condições finais de medição ainda precisam ser definidos.

Princípios discutidos para atingir a meta:

- Renderização da mesa com Phaser/WebGL.
- Texturas compartilhadas, elementos reutilizáveis e agrupamento de desenho quando adequado.
- Carregamento das artes necessárias à partida, em resoluções apropriadas.
- Limites de partículas, transparências sobrepostas e filtros de brilho.
- Animações contínuas sem atualizações de estado React a cada quadro.
- Ajustes de qualidade e resolução para equipamentos menos potentes.
- Medição durante jogadas e momentos exigentes, como várias habilidades e destruições encadeadas; não apenas com o tabuleiro parado.

## Consequências

A aparência detalhada pode ser preservada combinando arte pré-renderizada com poucos efeitos dinâmicos. Será necessário produzir cenário, molduras, cartas e efeitos como recursos separados; um mockup estático não fornece esses recursos automaticamente.

O primeiro protótipo deve validar simultaneamente a fidelidade visual e o desempenho. Ajustar orçamento de efeitos e resolução com base em medições, mantendo legibilidade e regras.

Este acordo não altera a exigência de equivalência mecânica das 145 cartas de Queen’s Blood nem cria bônus de facção. Complementa a decisão inicial: a direção geral do visual agora foi aprovada, mas as artes finais das 145 cartas, nomes definitivos e detalhes de produção continuam pendentes.

## Evidências e limites

A aprovação e a meta vêm da conversa com o usuário. Ainda não existe implementação ou benchmark que comprove 60 fps.

O arquivo de imagem foi copiado para o projeto para preservar a referência. A página do AI-Memory registra o caminho; não representa upload ou incorporação do arquivo binário. Para compartilhar a referência com outro ambiente, disponibilizar também a imagem.

