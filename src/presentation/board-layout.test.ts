import { expect, it } from "vitest";
import {
  boardCard,
  boardCell,
  CARD_WIDTH,
  CARD_HEIGHT,
  fitTable,
  TABLE_WIDTH,
  TABLE_HEIGHT,
  fanPosition,
  handPosition,
} from "./board-layout";

it("uses a standard portrait card proportion and fits the whole card inside every cell", () => {
  expect(CARD_WIDTH / CARD_HEIGHT).toBeCloseTo(390 / 534);
  for (let index = 0; index < 15; index++) {
    const cell = boardCell(index);
    const card = boardCard(index);
    expect(card.width / card.height).toBeCloseTo(390 / 534);
    expect(card.width / cell.width).toBeGreaterThan(0.9);
    expect(card.x).toBeGreaterThanOrEqual(cell.x);
    expect(card.y).toBeGreaterThanOrEqual(cell.y);
    expect(card.x + card.width).toBeLessThanOrEqual(cell.x + cell.width);
    expect(card.y + card.height).toBeLessThanOrEqual(cell.y + cell.height);
  }
});
it("keeps large generated hands inside their area without changing card size", () => {
  for (let count = 1; count <= 35; count++)
    for (let index = 0; index < count; index++) {
      expect(fanPosition(index, count, 740, true)).toBeGreaterThanOrEqual(
        -0.001,
      );
      expect(
        fanPosition(index, count, 740, true) + CARD_WIDTH,
      ).toBeLessThanOrEqual(740.001);
      const position = handPosition(index, count, true);
      expect(position.x + CARD_WIDTH).toBeLessThanOrEqual(760);
      expect(position.y + CARD_HEIGHT).toBeLessThanOrEqual(350.001);
    }
});

it("scales the entire composition uniformly to fit the available viewport", () => {
  for (const [width, height] of [
    [1920, 1044],
    [1280, 684],
    [390, 808],
  ]) {
    const fit = fitTable(width, height);
    expect(fit.width * fit.scale).toBeLessThanOrEqual(width);
    expect(fit.height * fit.scale).toBeLessThanOrEqual(height);
    expect(fit.scale).toBe(Math.min(width / fit.width, height / fit.height));
  }
  expect(fitTable(1440, TABLE_HEIGHT)).toEqual({
    width: TABLE_WIDTH,
    height: TABLE_HEIGHT,
    scale: 1,
  });
});
