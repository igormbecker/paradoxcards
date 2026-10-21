import { expect, it } from "vitest";
import { cards } from "./cards";
import { createMatch, playFromHand, score } from "./match";
const active = () => {
  const s = createMatch(42);
  s.phase = "play";
  s.hands = [[...cards], [...cards]];
  s.decks = [[], []];
  return s;
};
it("cria mãos independentes e começa pelo jogador zero", () => {
  const s = active();
  expect(s.turn).toBe(0);
  expect(s.hands.map((h) => h.length)).toEqual([3, 3]);
  expect(s.hands[0]).not.toBe(s.hands[1]);
});
it("consome exatamente a carta jogada e alterna sem modificar a entrada", () => {
  const s = active(),
    before = JSON.stringify(s);
  const r = playFromHand(s, 0, 0, 5);
  expect(r.ok).toBe(true);
  expect(r.state.hands[0].map((c) => c.id)).toEqual(
    cards.slice(1).map((c) => c.id),
  );
  expect(r.state.hands[1]).toEqual(s.hands[1]);
  expect(r.state.turn).toBe(1);
  expect(JSON.stringify(s)).toBe(before);
});
it("rejeita fora do turno, carta ausente e casa inválida sem consumir mão", () => {
  const s = active();
  for (const [p, h, i] of [
    [1, 0, 9],
    [0, 9, 5],
    [0, -1, 5],
    [0, 0.5, 5],
    [0, 0, 1],
  ] as const) {
    const r = playFromHand(s, p, h, i);
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  }
});
it("permite resposta do segundo jogador e retorna o turno", () => {
  const a = playFromHand(active(), 0, 0, 5).state;
  const b = playFromHand(a, 1, 0, 9);
  expect(b.ok).toBe(true);
  expect(b.state.turn).toBe(0);
  expect(b.state.hands.map((h) => h.length)).toEqual([2, 2]);
});
it("não permite reutilizar a carta removida", () => {
  const s = active();
  s.hands = [[cards[0]], [cards[0]]];
  const a = playFromHand(s, 0, 0, 5).state;
  const b = playFromHand(a, 1, 0, 9).state;
  expect(playFromHand(b, 0, 0, 0).ok).toBe(false);
});
it("soma forças por linha e só concede pontos nas linhas vencidas", () => {
  const s = active();
  s.board[0].unit = { ...cards[0], power: 7 };
  s.board[4].unit = { ...cards[0], power: 5 };
  s.board[5].unit = { ...cards[0], power: 4 };
  s.board[9].unit = { ...cards[0], power: 4 };
  s.board[10].unit = { ...cards[0], power: 2 };
  s.board[14].unit = { ...cards[0], power: 6 };
  expect(score(s)).toEqual({
    rows: [
      [7, 5],
      [4, 4],
      [2, 6],
    ],
    total: [7, 6],
  });
});
it("começa com placares zerados e atualiza após jogada", () => {
  expect(score(active()).total).toEqual([0, 0]);
  expect(score(playFromHand(active(), 0, 0, 5).state)).toEqual({
    rows: [
      [0, 0],
      [2, 0],
      [0, 0],
    ],
    total: [2, 0],
  });
});
