import { useEffect, useRef, useState, type CSSProperties } from "react";

import Phaser from "phaser";
import { PlacementController } from "../../application/match-controller";
import { canPlay, score } from "../../game/match";
import { BoardScene } from "../phaser/board-scene";
import { cardArtPosition, cardDisplayName, cardImage } from "../card-art";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_HEIGHT,
  CARD_WIDTH,
  CARD_HEIGHT,
  fitTable,
  boardCell,
  fanPosition,
  handPosition,
} from "../board-layout";
import "./Game.css";

const names = ["Viajantes", "Guardiões"];
export default function Game({
  remote,
  username,
  enabled,
  revision,
}: {
  remote: PlacementController;
  username: string;
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
  const viewport = useRef<HTMLFieldSetElement>(null);
  const [fit, setFit] = useState(fitTable(1440, 1000));
  useEffect(() => {
    const element = viewport.current!;
    const resize = () =>
      setFit(fitTable(element.clientWidth, element.clientHeight));
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const player = state.turn,
    hand = state.hands[player],
    opponent = state.hands[player === 0 ? 1 : 0],
    card = hand[selected];
  const scores = state.result ?? score(state);
  const destinations = state.board.filter((_, index) =>
    canPlay(state, player, selected, index),
  ).length;
  const playable = hand.some((_, h) =>
    state.board.some((_, i) => canPlay(state, player, h, i)),
  );
  const turnLabel =
    state.phase === "opening"
      ? `Prepare a mão dos ${names[player]}`
      : state.phase === "ended"
        ? state.result?.winner === null
          ? "Empate"
          : `${names[state.result!.winner!]} venceram`
        : `Vez dos ${names[player]}`;
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
        ? `${cardDisplayName(played.id, played.name)} em ${"ABC"[Math.floor(index / 5)]}${(index % 5) + 1}. ${result.state.phase === "ended" ? "Sem novas jogadas possíveis. Partida encerrada." : `Vez dos ${names[result.state.turn]}.`}`
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
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      transparent: true,
      scene: board,
      scale: { mode: Phaser.Scale.NONE },
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
    <fieldset
      ref={viewport}
      className="game-controls game-surface"
      disabled={!enabled}
    >
      <div
        className="table-stage"
        data-portrait={fit.width === 800}
        style={
          {
            width: fit.width,
            height: fit.height,
            transform: `translate(-50%, -50%) scale(${fit.scale})`,
            "--card-width": `${CARD_WIDTH}px`,
            "--card-height": `${CARD_HEIGHT}px`,
            "--board-width": `${BOARD_WIDTH}px`,
            "--board-height": `${BOARD_HEIGHT}px`,
          } as CSSProperties
        }
      >
        <main className="observatory" aria-label="Mesa do observatório">
          <header className="observatory-header">
            <div>
              <p className="subtitle">O observatório temporal</p>
              <h1>Paradox: The Card Game</h1>
            </div>
            <h2 className="turn-banner" data-testid="turn">
              {turnLabel}
            </h2>
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
          <section
            className="opponent-hand"
            style={
              {
                "--opponent-count": Math.max(
                  1,
                  state.hands[player === 0 ? 1 : 0].length,
                ),
              } as CSSProperties
            }
            aria-label={`Mão oculta dos ${names[player === 0 ? 1 : 0]}`}
          >
            {state.phase !== "opening" &&
              state.hands[player === 0 ? 1 : 0].map((_, index) => (
                <span
                  className="opponent-card"
                  key={index}
                  style={
                    {
                      "--back-tilt": `${(index - (opponent.length - 1) / 2) * Math.min(2, 8 / Math.max(1, opponent.length - 1))}deg`,
                      left: fanPosition(
                        index,
                        opponent.length,
                        fit.width === 800 ? 740 : 950,
                        true,
                      ),
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
              ))}
          </section>
          <div className="layout">
            <section
              className="player-identity player-left"
              aria-label="Jogador dos Viajantes"
              data-active={player === 0}
            >
              <span className="player-emblem" aria-hidden="true">
                ◈
              </span>
              <strong title={username}>{username}</strong>
              <span>Viajantes · Treino</span>
              <small>
                Baralho {state.decks[0].length} · Mão {state.hands[0].length}
              </small>
            </section>
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
                      style={{
                        top: `${((12 + CELL_HEIGHT / 2 + i * CELL_HEIGHT) / BOARD_HEIGHT) * 100}%`,
                      }}
                      aria-label={`Linha ${"ABC"[i]}, Viajantes: ${row[0]}`}
                    >
                      {row[0]}
                    </span>
                  ))}
                </div>
                <div className="canvas">
                  <div ref={host} className="phaser-mount" aria-hidden="true" />
                  <div className="board-targets" aria-label="Escolher casa">
                    {state.board.map((cell, i) => {
                      const bounds = boardCell(i);
                      return (
                        <button
                          key={i}
                          className="board-target"
                          disabled={
                            !enabled || !canPlay(state, player, selected, i)
                          }
                          style={{
                            left: `${(bounds.x / BOARD_WIDTH) * 100}%`,
                            top: `${(bounds.y / BOARD_HEIGHT) * 100}%`,
                            width: `${(bounds.width / BOARD_WIDTH) * 100}%`,
                            height: `${(bounds.height / BOARD_HEIGHT) * 100}%`,
                          }}
                          onPointerEnter={() => scene.current?.preview(i)}
                          onPointerLeave={() => scene.current?.preview(null)}
                          onFocus={() => scene.current?.preview(i)}
                          onBlur={() => scene.current?.preview(null)}
                          onClick={() => place.current(i)}
                          aria-label={`${"ABC"[Math.floor(i / 5)]}${(i % 5) + 1}, ${cell.rank} peões`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div
                  className="row-scores right"
                  aria-label="Força dos Guardiões por linha"
                >
                  {scores.rows.map((row, i) => (
                    <span
                      key={i}
                      data-testid={`row-score-1-${i}`}
                      className={row[1] > row[0] ? "winning" : ""}
                      style={{
                        top: `${((12 + CELL_HEIGHT / 2 + i * CELL_HEIGHT) / BOARD_HEIGHT) * 100}%`,
                      }}
                      aria-label={`Linha ${"ABC"[i]}, Guardiões: ${row[1]}`}
                    >
                      {row[1]}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="player-identity player-right"
              aria-label="Jogador dos Guardiões"
              data-active={player === 1}
            >
              <span className="player-emblem" aria-hidden="true">
                ◈
              </span>
              <strong title={username}>{username}</strong>
              <span>Guardiões · Treino</span>
              <small>
                Baralho {state.decks[1].length} · Mão {state.hands[1].length}
              </small>
            </section>
          </div>
          <div className="match-feedback">
            <p className="selection-description">
              {card
                ? `${cardDisplayName(card.id, card.name)} · Poder ${card.power} · ${state.phase === "opening" ? "Selecione para trocar" : `${destinations} ${destinations === 1 ? "casa disponível" : "casas disponíveis"}`}`
                : "Sua mão está vazia."}
            </p>
            <p aria-live="polite" className="preview-description">
              {previewText}
            </p>
            <p role="status" className="message">
              {message}
            </p>
            <p className="ability-description" title={card?.abilityText}>
              {card?.abilityText}
            </p>
          </div>
          <div className="hand-actions">
            <section
              className="hand"
              style={
                { "--hand-count": Math.max(1, hand.length) } as CSSProperties
              }
              data-side={player}
              aria-label={`Mão dos ${names[player]}`}
            >
              {hand.map((c, i) => (
                <button
                  key={`${c.id}-${i}`}
                  data-card-id={c.id}
                  data-rank={c.rank}
                  data-power={c.power}
                  data-reference={!!cardImage(c.id)}
                  title={c.abilityText}
                  aria-label={`${cardDisplayName(c.id, c.name)}, poder ${c.power}, ${c.abilityText ?? "Carta provisória"}`}
                  disabled={!enabled || state.phase === "ended"}
                  className={`card ${state.phase === "opening" && marked.includes(i) ? "marked" : ""}`}
                  style={
                    {
                      "--card-tilt": `${(i - (hand.length - 1) / 2) * 1.5}deg`,
                      "--card-x": `${handPosition(i, hand.length, fit.width === 800).x}px`,
                      "--card-y": `${handPosition(i, hand.length, fit.width === 800).y}px`,
                    } as CSSProperties
                  }
                  aria-pressed={
                    state.phase === "opening"
                      ? marked.includes(i)
                      : selected === i
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
                    <span className="card-rank">{"◆".repeat(c.rank)}</span>
                    <b>{c.power}</b>
                  </span>
                  <span
                    className="card-art"
                    style={
                      cardImage(c.id)
                        ? {
                            backgroundImage: `url("${cardImage(c.id)}")`,
                            backgroundPosition: "center",
                            backgroundSize: "100% 100%",
                          }
                        : { backgroundPosition: cardArtPosition(c.id) }
                    }
                    aria-hidden="true"
                  />
                  <strong>{cardDisplayName(c.id, c.name)}</strong>
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
            <section className="match-actions" aria-label="Ações da partida">
              {state.phase === "ended" && (
                <div className="match-result">
                  <h2>Resultado final</h2>
                  <p>
                    Viajantes {scores.total[0]} · Guardiões {scores.total[1]}
                  </p>
                </div>
              )}
              {state.phase === "opening" && (
                <div className="opening">
                  <button
                    onClick={async () => {
                      const r = await controller.current.opening(
                        player,
                        marked,
                      );
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
                    setMessage(
                      "Nova mão sorteada. Prepare a mão dos Viajantes.",
                    );
                  }}
                >
                  Nova partida
                </button>
              )}
            </section>
          </div>
          <footer>
            <div className="match-counts">
              <p data-testid="deck-counts">
                Baralhos: {state.decks[0].length} Viajantes ·{" "}
                {state.decks[1].length} Guardiões
              </p>
              <p data-testid="hand-counts">
                Mãos: {state.hands[0].length} Viajantes ·{" "}
                {state.hands[1].length} Guardiões
              </p>
            </div>
            <span>Treino · Cartas provisórias</span>
          </footer>
        </main>
      </div>
    </fieldset>
  );
}
