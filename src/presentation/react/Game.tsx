import { useEffect, useRef, useState } from "react";

import Phaser from "phaser";
import { PlacementController } from "../../application/match-controller";
import { canPlay, score } from "../../game/match";
import { BoardScene } from "../phaser/board-scene";

const names = ["Viajantes", "Guardiões"];
export default function Game({
  remote,
  enabled,
  revision,
}: {
  remote: PlacementController;
  enabled: boolean;
  revision: number;
}) {
  const controller = useRef(remote);
  const [state, setState] = useState(controller.current.state);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState(
    "Marque as cartas para trocar ou mantenha sua mão inicial.",
  );
  const [previewText, setPreviewText] = useState("");
  const [marked, setMarked] = useState<number[]>([]);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const player = state.turn,
    hand = state.hands[player],
    card = hand[selected];
  const scores = state.result ?? score(state);
  const playable = hand.some((_, h) =>
    state.board.some((_, i) => canPlay(state, player, h, i)),
  );
  const current = useRef({
    state,
    player,
    card: enabled && state.phase === "play" ? card : undefined,
  });
  current.current = {
    state,
    player,
    card: enabled && state.phase === "play" ? card : undefined,
  };
  const place = useRef<(index: number) => void>(() => {});
  place.current = async (index) => {
    if (!enabled) return;
    const s = controller.current.state,
      played = s.hands[s.turn][selected];
    const result = await controller.current.place(s.turn, selected, index);
    setMessage(
      result.ok
        ? `${played.name} em ${"ABC"[Math.floor(index / 5)]}${(index % 5) + 1}. ${result.state.phase === "ended" ? "Sem novas jogadas possíveis. Partida encerrada." : `Vez dos ${names[result.state.turn]}.`}`
        : "Jogada indisponível. Escolha uma carta da mão e uma casa dourada.",
    );
    if (result.ok) {
      setSelected(0);
      setState(result.state);
    }
  };
  useEffect(() => {
    const board = new BoardScene(
      () => current.current,
      (i) => place.current(i),
      setPreviewText,
    );
    scene.current = board;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      width: 756,
      height: 438,
      backgroundColor: "#101c20",
      scene: board,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
    });
    return () => {
      scene.current = null;
      game.destroy(true);
    };
  }, []);
  useEffect(() => {
    if (scene.current?.sys.isActive()) scene.current.paint();
  }, [state, selected, enabled]);
  useEffect(() => {
    setState(remote.state);
    setSelected(0);
    setMarked([]);
  }, [remote, revision]);
  return (
    <fieldset className="game-controls" disabled={!enabled}>
      <main>
        <header>
          <div>
            <p className="subtitle">O observatório temporal</p>
            <h1>Paradox Cards</h1>
          </div>
          <button
            onClick={async () => {
              await controller.current.reset();
              setSelected(0);
              setMarked([]);
              setState(controller.current.state);
              setMessage("Nova mão sorteada. Prepare a mão dos Viajantes.");
            }}
          >
            Reiniciar mesa
          </button>
        </header>
        <section className="intro">
          <h2>A primeira fissura no tempo</h2>
          <p>
            Explore o território. Posicione seus guardiões. Abra caminho para a
            próxima era.
          </p>
        </section>
        <div className="layout">
          <section className="table">
            <div className="table-heading">
              <span>◈ Viajantes</span>
              <span>Território 3 × 5</span>
              <span>Guardiões ◈</span>
            </div>
            <div className="board-with-scores">
              <div
                className="row-scores left"
                aria-label="Força dos Viajantes por linha"
              >
                {scores.rows.map((row, i) => (
                  <span
                    key={i}
                    data-testid={`row-score-0-${i}`}
                    className={row[0] > row[1] ? "winning" : ""}
                    style={{ top: `${((87 + i * 138) / 438) * 100}%` }}
                    aria-label={`Linha ${"ABC"[i]}, Viajantes: ${row[0]}`}
                  >
                    {row[0]}
                  </span>
                ))}
              </div>
              <div
                ref={host}
                className="canvas"
                role="img"
                aria-label="Mesa de jogo. Use os botões de casas abaixo para jogar pelo teclado."
              />
              <div
                className="row-scores right"
                aria-label="Força dos Guardiões por linha"
              >
                {scores.rows.map((row, i) => (
                  <span
                    key={i}
                    data-testid={`row-score-1-${i}`}
                    className={row[1] > row[0] ? "winning" : ""}
                    style={{ top: `${((87 + i * 138) / 438) * 100}%` }}
                    aria-label={`Linha ${"ABC"[i]}, Guardiões: ${row[1]}`}
                  >
                    {row[1]}
                  </span>
                ))}
              </div>
            </div>
            <div className="coordinates" aria-label="Escolher casa">
              {state.board.map((cell, i) => (
                <button
                  key={i}
                  disabled={!enabled || !canPlay(state, player, selected, i)}
                  onFocus={() => scene.current?.preview(i)}
                  onBlur={() => scene.current?.preview(null)}
                  onClick={() => place.current(i)}
                  aria-label={`${"ABC"[Math.floor(i / 5)]}${(i % 5) + 1}, ${cell.rank} peões`}
                >
                  {"ABC"[Math.floor(i / 5)]}
                  {(i % 5) + 1}
                </button>
              ))}
            </div>
          </section>
          <aside>
            <h2>
              {state.phase === "ended" ? "Resultado final" : "Resultado geral"}
            </h2>
            <div className="total-score" aria-label="Placar geral">
              <span>
                Viajantes <b>{scores.total[0]}</b>
              </span>
              <span>
                Guardiões <b>{scores.total[1]}</b>
              </span>
            </div>
            <p className="score-help">
              {state.phase === "ended"
                ? "Partida encerrada. Pontuação final."
                : "Resultado parcial: soma da força nas linhas vencidas. Empates não pontuam."}
            </p>
            <h2 data-testid="turn">
              {state.phase === "opening"
                ? `Prepare a mão dos ${names[player]}`
                : state.phase === "ended"
                  ? state.result?.winner === null
                    ? "Empate"
                    : `${names[state.result!.winner!]} venceram`
                  : `Vez dos ${names[player]}`}
            </h2>
            <p data-testid="deck-counts">
              Baralhos: {state.decks[0].length} Viajantes ·{" "}
              {state.decks[1].length} Guardiões
            </p>
            <p data-testid="hand-counts">
              Mãos: {state.hands[0].length} Viajantes · {state.hands[1].length}{" "}
              Guardiões
            </p>
            {card ? (
              <>
                <h2>{card.name}</h2>
                <p>
                  Exige {card.rank} peão. Poder {card.power}.
                </p>
              </>
            ) : (
              <p>Sua mão está vazia.</p>
            )}
            {state.phase === "opening" && (
              <div className="opening">
                <p>
                  Marque as cartas que deseja trocar. Você pode confirmar uma
                  única vez, ou manter as cinco.
                </p>
                <button
                  onClick={async () => {
                    const r = await controller.current.opening(player, marked);
                    if (r.ok) {
                      setState(r.state);
                      setMarked([]);
                      setSelected(0);
                      setMessage(
                        r.state.phase === "play"
                          ? "Mãos prontas. Vez dos Viajantes."
                          : "Agora prepare a mão dos Guardiões.",
                      );
                    }
                  }}
                >
                  {marked.length
                    ? `Trocar ${marked.length} e confirmar`
                    : "Manter mão e confirmar"}
                </button>
              </div>
            )}
            {state.phase === "play" && (
              <>
                <button
                  onClick={async () => {
                    const r = await controller.current.pass();
                    if (r.ok) {
                      setState(r.state);
                      setSelected(0);
                      setMessage(
                        r.state.phase === "ended"
                          ? "Partida encerrada. Confira o resultado final."
                          : `${names[player]} passaram. Vez dos ${names[r.state.turn]}.`,
                      );
                    }
                  }}
                >
                  {state.passes === 1
                    ? "Passar e encerrar partida"
                    : "Passar a vez"}
                </button>
                {!playable && (
                  <p className="notice">
                    Sem jogadas disponíveis. Passe a vez.
                  </p>
                )}
              </>
            )}
            {state.phase === "ended" && (
              <button
                onClick={async () => {
                  await controller.current.reset();
                  setState(controller.current.state);
                  setMarked([]);
                  setSelected(0);
                  setMessage("Nova mão sorteada. Prepare a mão dos Viajantes.");
                }}
              >
                Nova partida
              </button>
            )}
            <p className="notice">
              Teste local: você controla os dois lados. Baralhos fixos de 15
              cartas provisórias; somente a ordem é sorteada. Sem habilidades ou
              IA.
            </p>
          </aside>
        </div>
        <p aria-live="polite" className="preview-description">
          {previewText}
        </p>
        <p role="status" className="message">
          {message}
        </p>
        <section className="hand" aria-label={`Mão dos ${names[player]}`}>
          {hand.map((c, i) => (
            <button
              key={`${c.id}-${i}`}
              data-card-id={c.id}
              data-rank={c.rank}
              data-power={c.power}
              disabled={!enabled || state.phase === "ended"}
              className={`card ${state.phase === "opening" && marked.includes(i) ? "marked" : ""}`}
              aria-pressed={
                state.phase === "opening" ? marked.includes(i) : selected === i
              }
              onClick={async () => {
                setSelected(i);
                if (state.phase === "opening")
                  setMarked((previous) =>
                    previous.includes(i)
                      ? previous.filter((n) => n !== i)
                      : [...previous, i],
                  );
              }}
            >
              <span className="card-meta">
                {"◆".repeat(c.rank)}
                <b>{c.power}</b>
              </span>
              <span className="sigil">◈</span>
              <strong>{c.name}</strong>
              <span className="pattern">
                {Array.from({ length: 9 }, (_, j) => (
                  <i
                    key={j}
                    className={
                      j === 4
                        ? "origin"
                        : c.reach.some(
                              ([r, col]) =>
                                (r + 1) * 3 +
                                  col * (player === 0 ? 1 : -1) +
                                  1 ===
                                j,
                            )
                          ? "reach"
                          : ""
                    }
                  />
                ))}
              </span>
              <small>Expansão territorial</small>
            </button>
          ))}
        </section>
        <footer>
          Protótipo 03 · Preparação e partida · Artes e atributos provisórios
        </footer>
      </main>
    </fieldset>
  );
}
