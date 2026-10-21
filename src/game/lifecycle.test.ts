import { expect, it } from "vitest";
import {
  createMatch,
  confirmOpening,
  passTurn,
  playFromHand,
  canPlay,
  score,
} from "./match";
import { cards } from "./cards";
const ready = () =>
  confirmOpening(confirmOpening(createMatch(12), 0, []).state, 1, []).state;
it("sorteia cinco de quinze por lado de forma reproduzível", () => {
  const s = createMatch(42);
  expect(s).toEqual(createMatch(42));
  expect(s.hands.map((h) => h.length)).toEqual([5, 5]);
  expect(s.decks.map((d) => d.length)).toEqual([10, 10]);
  expect(s.phase).toBe("opening");
  expect(createMatch(43).hands).not.toEqual(s.hands);
});
it("bloqueia jogada e passe durante preparação", () => {
  const s = createMatch(1);
  expect(playFromHand(s, 0, 0, 0).ok).toBe(false);
  expect(passTurn(s, 0).ok).toBe(false);
});
it("troca apenas cartas marcadas, mantém cinco e preserva o conjunto e a entrada", () => {
  const s = createMatch(3),
    before = JSON.stringify(s),
    r = confirmOpening(s, 0, [0, 2]);
  expect(r.ok).toBe(true);
  expect(r.state.hands[0][1]).toEqual(s.hands[0][1]);
  expect(r.state.hands[0][0]).toEqual(s.decks[0][0]);
  expect(r.state.hands[0][2]).toEqual(s.decks[0][1]);
  expect(r.state.decks[0]).toHaveLength(10);
  expect(
    [...r.state.hands[0], ...r.state.decks[0]].map((c) => c.id).sort(),
  ).toEqual([...s.hands[0], ...s.decks[0]].map((c) => c.id).sort());
  expect(JSON.stringify(s)).toBe(before);
});
it("aceita manter a mão e permite uma única confirmação por jogador", () => {
  const s = createMatch(1);
  const a = confirmOpening(s, 0, []);
  expect(a.state.hands[0]).toEqual(s.hands[0]);
  expect(confirmOpening(a.state, 0, [0]).ok).toBe(false);
  const b = confirmOpening(a.state, 1, []);
  expect(b.state.phase).toBe("play");
  expect(b.state.turn).toBe(0);
  expect(b.state.hands[0]).toHaveLength(5);
  expect(confirmOpening(b.state, 1, []).ok).toBe(false);
});
it("rejeita seleções repetidas e índices inválidos", () => {
  const s = createMatch(1);
  for (const indices of [[0, 0], [-1], [5], [0.5]])
    expect(confirmOpening(s, 0, indices).state).toBe(s);
});
it("troca todas as cinco usando o restante do baralho antes de devolver descartadas", () => {
  const s = createMatch(9);
  expect(confirmOpening(s, 0, [0, 1, 2, 3, 4]).state.hands[0]).toEqual(
    s.decks[0].slice(0, 5),
  );
});
it("compra ao entrar no próximo turno, inclusive após passe", () => {
  const s = ready();
  s.hands[0] = [cards[0]];
  const next = s.decks[1][0],
    r = playFromHand(s, 0, 0, 5);
  expect(r.state.hands[0]).toHaveLength(0);
  expect(r.state.hands[1]).toHaveLength(6);
  expect(r.state.hands[1].at(-1)).toEqual(next);
  expect(r.state.decks[1]).toHaveLength(9);
  expect(passTurn(r.state, 1).state.hands[0]).toHaveLength(1);
});
it("dois passes encerram sem compra extra, congelam placar e bloqueiam ações", () => {
  const s = ready();
  s.board[0].unit = cards[0];
  const a = passTurn(s, 0).state;
  const b = passTurn(a, 1).state;
  expect(b.phase).toBe("ended");
  expect(b.result).toEqual({ ...score(s), winner: 0 });
  expect(b.decks[0]).toEqual(a.decks[0]);
  expect(playFromHand(b, b.turn, 0, 5).state).toBe(b);
  expect(passTurn(b, b.turn).state).toBe(b);
  expect(canPlay(b, b.turn, 0, 5)).toBe(false);
});
it("jogar interrompe sequência de passes e baralho vazio não causa erro", () => {
  let s = ready();
  s.decks = [[], []];
  s.hands = [[cards[0]], [cards[0]]];
  s = passTurn(s, 0).state;
  s = playFromHand(s, 1, 0, 9).state;
  expect(s.passes).toBe(0);
  expect(passTurn(s, 0).state.phase).toBe("play");
});
it("encerra com empate e rejeita passe fora do turno", () => {
  const s = ready();
  expect(passTurn(s, 1).state).toBe(s);
  expect(passTurn(passTurn(s, 0).state, 1).state.result?.winner).toBeNull();
});
it("encerra automaticamente ao ocupar a última casa e bloqueia novas ações", () => {
  const s = ready();
  s.board = s.board.map(() => ({ owner: 0, rank: 1, unit: cards[0] }));
  s.board[5].unit = null;
  s.hands[0] = [cards[0]];
  const before = JSON.stringify(s),
    r = playFromHand(s, 0, 0, 5);
  expect(r.state.phase).toBe("ended");
  expect(r.state.result?.winner).toBe(0);
  expect(r.state.result?.total).toEqual([30, 0]);
  expect(passTurn(r.state, r.state.turn).ok).toBe(false);
  expect(JSON.stringify(s)).toBe(before);
});
it("encerra quando nenhum jogador tem cartas jogáveis nem pode comprá-las", () => {
  const s = ready();
  s.decks = [[], []];
  s.hands = [[cards[0]], []];
  expect(playFromHand(s, 0, 0, 5).state.phase).toBe("ended");
});
it("não encerra se o adversário ainda pode jogar ou comprar uma carta útil", () => {
  const s = ready();
  s.hands = [[cards[0]], []];
  s.decks = [[], [cards[2], cards[0]]];
  const r = playFromHand(s, 0, 0, 5);
  expect(r.state.phase).toBe("play");
  expect(r.state.hands[1]).toEqual([cards[2]]);
});
