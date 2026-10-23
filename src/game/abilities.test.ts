import { expect, it } from "vitest";
import { referenceCards, referenceCard } from "./reference-cards";
import { createState, placeCard, canPlace, type Card } from "./placement";
import {
  score,
  createMatch,
  confirmOpening,
  canPlay,
  playFromHand,
  passTurn,
} from "./match";
import { tokens } from "./tokens";
const card = (id: number) =>
  referenceCard(`qb-${String(id).padStart(3, "0")}`)!;
const victim = (power = 3): Card => ({
  id: "victim",
  name: "Victim",
  power,
  rank: 1,
  reach: [],
});
it("preserves all 145 cards with separate expansion, effect and executable ability definitions", () => {
  expect(referenceCards).toHaveLength(145);
  expect(new Set(referenceCards.map((c) => c.id)).size).toBe(145);
  expect(
    referenceCards.every((c) => c.ability && c.image && c.abilityText),
  ).toBe(true);
  expect(card(3).reach).not.toEqual(card(3).effectOffsets);
});
it("applies targeted on-play damage, destroys at zero and preserves input", () => {
  const state = createState();
  state.board[5].rank = 2;
  state.board[7] = { owner: 1, rank: 1, unit: victim() };
  const before = JSON.stringify(state);
  const result = placeCard(state, 0, card(3), 5);
  expect(result.ok).toBe(true);
  expect(result.state.board[7].unit).toBeNull();
  expect(JSON.stringify(state)).toBe(before);
});
it("applies and removes a continuous aura when its source is replaced", () => {
  const state = createState();
  state.board[0].rank = 2;
  state.board[5].unit = victim();
  const enhanced = placeCard(state, 0, card(9), 0).state;
  expect(enhanced.board[5].unit!.power).toBe(4);
  expect(canPlace(enhanced, 0, card(51), 0)).toBe(true);
  const replaced = placeCard(enhanced, 0, card(51), 0).state;
  expect(replaced.board[5].unit!.power).toBe(3);
  expect(canPlace(createState(), 0, card(51), 0)).toBe(false);
});
it("returns generated cards to their owner without playing them from hand", () => {
  const result = placeCard(createState(), 0, card(10), 5);
  expect(result.generated?.[0].map((c) => c.name)).toEqual([
    "Mandragora Minion",
  ]);
  expect(result.generated?.[1]).toEqual([]);
});
it("awards lane bonuses only after determining the winning lane", () => {
  const state = createState();
  state.board[0].unit = card(88);
  state.board[4].unit = victim(2);
  expect(score(state).total).toEqual([0, 2]);
  state.board[4].unit = null;
  expect(score(state).total).toEqual([6, 0]);
});

it("mirrors damage offsets and never damages an ally for an enemy-only effect", () => {
  const state = createState();
  state.board[9].rank = 2;
  state.board[7] = { owner: 0, rank: 2, unit: victim(6) };
  state.board[2] = { owner: 1, rank: 1, unit: victim(6) };
  const result = placeCard(state, 1, card(3), 9).state;
  expect(result.board[7].unit!.power).toBe(2);
  expect(result.board[2].unit!.power).toBe(6);
});

it("resolves a death chain and rewards surviving destruction listeners exactly once", () => {
  const state = createState();
  state.board[5].unit = card(36); // Sandhog Pie enhances the tile above when destroyed.
  state.board[0].unit = card(58); // Skeeskee receives both its listener and the death effect.
  const result = placeCard(state, 0, card(51), 5).state;
  expect(result.board[0].unit!.power).toBe(card(58).power + 1 + 3);
});

it("fires an enhancement trigger once per placed instance", () => {
  const state = createState();
  state.board[5].unit = card(48); // Amphidex
  state.board[0].unit = victim(3);
  const crab = { ...card(13), effectOffsets: [[0, 1]] as const };
  const custom = { ...crab, reach: [] };
  const input = { ...state, board: state.board.map((c) => ({ ...c })) };
  input.board[6] = { owner: 0, rank: 1, unit: null };
  const first = placeCard(
    input,
    0,
    { ...custom, effectOffsets: [[0, -1]] },
    6,
  ).state;
  expect(first.board[0].unit!.power).toBe(6);
  const second = placeCard(first, 0, card(1), 10).state;
  expect(second.board[0].unit!.power).toBe(6);
});

it("uses replaced effective power for replacement abilities", () => {
  const state = createState();
  state.board[5].unit = victim(7);
  state.board[1] = { owner: 0, rank: 1, unit: victim(2) };
  const result = placeCard(state, 0, card(59), 5).state;
  expect(result.board[1].unit!.power).toBe(9);
});

it("spawns tokens using each position rank and does not fire played-from-hand listeners", () => {
  const state = createState();
  state.board[0].rank = 2;
  state.board[5].rank = 3;
  state.board[10].unit = card(32);
  const result = placeCard(state, 0, card(96), 0).state;
  expect(result.board[5].unit!.name).toBe("Diamond Dust");
  expect(result.board[5].unit!.power).toBe(6);
  expect(result.board[10].unit!.power).toBe(card(32).power + 1);
});

it("counts enhanced allies without accumulating the previous dynamic bonus", () => {
  const state = createState();
  state.board[0].rank = 3;
  state.board[5].unit = { ...victim(3), basePower: 2, modifier: 1 };
  const first = placeCard(state, 0, card(95), 0).state;
  expect(first.board[0].unit!.power).toBe(card(95).power + 2);
  const second = placeCard(first, 0, card(1), 10).state;
  expect(second.board[0].unit!.power).toBe(card(95).power + 2);
});

it("increases expansion ranks by the card-specific value", () => {
  const state = createState();
  state.board[5].rank = 2;
  const result = placeCard(state, 0, card(98), 5).state;
  expect(result.board[6].rank).toBe(2);
  expect(result.board[10].rank).toBe(3);
});

it("transfers losing lane points when Ultimate Party Animal is in play", () => {
  const state = createState();
  state.board[0].unit = card(142);
  state.board[4].unit = victim(3);
  expect(score(state).total).toEqual([0, 4]);
});

it.each(referenceCards)(
  "resolves $name reproducibly without mutating its definition",
  (definition) => {
    const state = createState();
    state.board[5].rank = 3;
    if (definition.placementType === "replacement")
      state.board[5].unit = victim(4);
    state.board[0].unit = victim(4);
    state.board[6] = { owner: 1, rank: 2, unit: victim(4) };
    const before = JSON.stringify([definition, state]);
    const first = placeCard(state, 0, definition, 5);
    expect(first.ok).toBe(true);
    expect(first).toEqual(placeCard(state, 0, definition, 5));
    expect(JSON.stringify([definition, state])).toBe(before);
    expect(first.state.board).toHaveLength(15);
    expect(
      first.state.board.every((cell) => !cell.unit || cell.unit.power > 0),
    ).toBe(true);
  },
);

it("has executable definitions for all auxiliary cards", () => {
  expect(tokens).toHaveLength(17);
  expect(tokens.every((token) => token.ability)).toBe(true);
});

it("finishes seeded matches with mixed abilities without loops or invalid surviving power", () => {
  for (let seed = 1; seed <= 80; seed++) {
    let state = confirmOpening(
      confirmOpening(createMatch(seed), 0, []).state,
      1,
      [],
    ).state;
    let moves = 0;
    while (state.phase !== "ended" && moves++ < 160) {
      const options = state.hands[state.turn].flatMap((_, h) =>
        state.board.flatMap((_, i) =>
          canPlay(state, state.turn, h, i) ? [[h, i] as const] : [],
        ),
      );
      const option = options[(seed + moves) % Math.max(1, options.length)];
      const result = option
        ? playFromHand(state, state.turn, option[0], option[1])
        : passTurn(state, state.turn);
      expect(result.ok).toBe(true);
      state = result.state;
      expect(
        state.board.every(
          (cell) =>
            !cell.unit ||
            (Number.isFinite(cell.unit.power) && cell.unit.power > 0),
        ),
      ).toBe(true);
    }
    expect(state.phase).toBe("ended");
    expect(moves).toBeLessThan(160);
  }
});
