# Fogueira da página inicial

## Imagem preservada

`public/assets/backgrounds/forest-camp-portal.png` continua sendo a imagem original, sem edição. Backup idêntico em `docs/assets/forest-camp-portal-original.png`.

SHA-256 de ambos: `ff8e0d05e02a6877dad2928c7b1da60d8864e96928e19b200a4d6a31900bcfba`.

## Movimento

A implementação usa uma camada WebGL transparente sobre a imagem, com a mesma escala e recorte responsivo. Distorce localmente a textura das chamas, varia sua intensidade e acrescenta cinco pequenas brasas. Portal, floresta, cartas e câmera permanecem parados. Não é um vídeo gerado; é animação da ilustração original, com movimento limitado pela textura pintada.

O renderizador limita solicitações de desenho a 30 quadros por segundo e largura de 1600 pixels; isso é uma configuração, não um benchmark de desempenho. A animação pausa em abas ocultas, pode ser desativada pelo controle da página e começa desligada para quem prefere movimento reduzido. Sem WebGL ou se o shader falhar, a imagem estática permanece disponível.

## Áudio

Arquivo local: `public/assets/audio/campfire.wav`.

Gravação original: **Fireplace Sound loop**, de **PagDev**, publicada no OpenGameArt em 13/03/2021, licença **CC0 1.0**.

- Página e licença declarada: https://opengameart.org/content/fireplace-sound-loop
- Fonte: https://opengameart.org/sites/default/files/fire.wav
- Licença: https://creativecommons.org/publicdomain/zero/1.0/

A cópia de uso foi convertida de PCM estéreo de 32 bits/44,1 kHz para PCM mono de 16 bits/22,05 kHz, com aproximadamente 29,26 segundos. Não contém fala ou música. O arquivo é servido pelo próprio projeto, sem dependência de terceiros em tempo de execução.

O som começa desligado, não é pré-carregado e somente toca após o clique em **Som da fogueira**, em volume de 30%. Pode ser desligado no mesmo botão, pausa quando a aba fica oculta e encerra ao sair da página inicial. Não reinicia automaticamente ao retornar à aba. Não há persistência de preferência que permita autoplay em uma visita seguinte.

## Verificação

O teste de integridade confirma o hash e a igualdade do backup. Os testes de navegador verificam quadros diferentes da animação, áudio opt-in, pausa, movimento reduzido e falha ao carregar áudio, além do fluxo de login existente.
