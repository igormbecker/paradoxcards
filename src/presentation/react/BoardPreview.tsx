import "./BoardPreview.css";

export default function BoardPreview() {
  return (
    <main className="board-preview">
      <header className="preview-header">
        <a href="/">Voltar à entrada</a>
        <h1>O tabuleiro do Paradox</h1>
        <a
          href="/assets/concepts/approved-board.png"
          target="_blank"
          rel="noreferrer"
        >
          Ampliar imagem
        </a>
      </header>
      <figure className="preview-concept">
        <img
          src="/assets/concepts/approved-board.png"
          alt="Conceito aprovado do tabuleiro: mesa de pedra em perspectiva no observatório, três linhas e cinco colunas, cartas ilustradas, placares laterais, inspeção à esquerda e mão em leque na base."
          fetchPriority="high"
        />
        <figcaption>
          Conceito estático da direção visual aprovada. As cartas, os números e
          os controles fazem parte da ilustração; esta tela não é uma partida
          interativa.
        </figcaption>
      </figure>
      <p className="preview-explanation">
        Esta é a composição que orienta a mesa do jogo. A versão jogável ainda
        precisa receber os cenários, as molduras e as ilustrações em camadas
        para reproduzir esse acabamento.
      </p>
    </main>
  );
}
