import { expect, it } from "vitest";
import fc from "fast-check";
import { createState, placeCard, type Card } from "./placement";
const card: Card = {
  id: "test",
  name: "Viajante",
  rank: 1,
  power: 2,
  reach: [
    [0, 1],
    [-1, 0],
    [1, 0],
  ],
};
it("prepara a grade e os territórios", () => {
  const s = createState();
  expect(s.board).toHaveLength(15);
  expect(s.board.filter((c) => c.owner === 0)).toHaveLength(3);
  expect(s.board.filter((c) => c.owner === 1)).toHaveLength(3);
  expect(s.board[1]).toEqual({ owner: null, rank: 0, unit: null });
});
it("coloca e expande sem modificar a entrada", () => {
  const s = createState(),
    before = JSON.stringify(s),
    r = placeCard(s, 0, card, 5);
  expect(r.ok).toBe(true);
  expect(r.state.board[5].unit).toEqual(card);
  expect(r.state.board[6]).toMatchObject({ owner: 0, rank: 1 });
  expect(r.state.board[0].rank).toBe(2);
  expect(r.state.board[10].rank).toBe(2);
  expect(JSON.stringify(s)).toBe(before);
  expect(r.events[0]).toEqual({ type: "card-placed", index: 5 });
});
it("espelha expansão", () => {
  expect(placeCard(createState(), 1, card, 9).state.board[8].owner).toBe(1);
});
it("captura mantendo rank", () => {
  const s = createState();
  s.board[6] = { owner: 1, rank: 3, unit: null };
  expect(placeCard(s, 0, card, 5).state.board[6]).toMatchObject({
    owner: 0,
    rank: 3,
  });
});
it("preserva ocupantes e limita rank", () => {
  const s = createState();
  s.board[6] = { owner: 1, rank: 2, unit: card };
  s.board[0].rank = 3;
  const r = placeCard(s, 0, card, 5);
  expect(r.state.board[6]).toEqual(s.board[6]);
  expect(r.state.board[0].rank).toBe(3);
});
it("rejeita casa ocupada, neutra, inimiga e rank insuficiente", () => {
  const s = createState();
  s.board[0].unit = card;
  for (const [c, i] of [
    [card, 0],
    [card, 1],
    [card, 4],
    [{ ...card, rank: 2 }, 5],
  ] as const) {
    const r = placeCard(s, 0, c, i);
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  }
});
it("rejeita índices inválidos", () => {
  fc.assert(
    fc.property(
      fc.integer().filter((i) => i < 0 || i >= 15),
      (i) => {
        const s = createState(),
          r = placeCard(s, 0, card, i);
        expect(r.ok).toBe(false);
        expect(r.state).toBe(s);
      },
    ),
  );
  expect(placeCard(createState(), 0, card, 0.5).ok).toBe(false);
});
it("respeita bordas", () => {
  const s = createState();
  expect(
    placeCard(s, 0, { ...card, reach: [[0, -1]] }, 5).state.board[4],
  ).toEqual(s.board[4]);
});
