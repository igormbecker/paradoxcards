import { expect, it } from "vitest";
import { createState, placeCard } from "./placement";
import { cards } from "./cards";
import { previewPlacement } from "./preview";
it("simula a mesma jogada do motor sem alterar o estado real", () => {
  const state = createState(),
    before = JSON.stringify(state);
  const preview = previewPlacement(state, 0, cards[0], 5)!;
  expect(preview.state).toEqual(placeCard(state, 0, cards[0], 5).state);
  expect(preview.changes.map((c) => c.index).sort()).toEqual(
    [0, 5, 6, 10].sort(),
  );
  expect(JSON.stringify(state)).toBe(before);
});
it("não oferece prévia para casas inválidas", () => {
  expect(previewPlacement(createState(), 0, cards[0], 4)).toBeNull();
});
it("distingue captura de território e ganho de peões", () => {
  const state = createState();
  state.board[6] = { owner: 1, rank: 2, unit: null };
  const preview = previewPlacement(state, 0, cards[0], 5)!;
  expect(preview.changes.find((c) => c.index === 6)?.kind).toBe("capture");
  expect(preview.changes.find((c) => c.index === 0)?.kind).toBe("rank");
});
