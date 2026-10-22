import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const catalog = JSON.parse(
  readFileSync(
    new URL("../docs/reference/queens-blood/cards.json", import.meta.url),
    "utf8",
  ),
) as {
  cards: {
    id: string;
    originalNumber: number;
    nameEn: string;
    power: number;
    rank: number;
    placementType: string;
    expansionOffsets: number[][];
    effectOffsets: number[][];
    pattern5x5: string[];
    abilityTextEn: string;
    image: string;
    imageSha256: string;
  }[];
};

test("reference preserves all 145 original numbers and required card fields", () => {
  expect(catalog.cards.map((card) => card.originalNumber)).toEqual(
    Array.from({ length: 145 }, (_, index) => index + 1),
  );
  expect(new Set(catalog.cards.map((card) => card.id)).size).toBe(145);
  for (const card of catalog.cards) {
    expect(card.id).toBe(`qb-${String(card.originalNumber).padStart(3, "0")}`);
    expect(card.nameEn.length).toBeGreaterThan(0);
    expect(Number.isInteger(card.power) && card.power >= 0).toBe(true);
    expect([0, 1, 2, 3]).toContain(card.rank);
    expect(card.placementType === "replacement").toBe(card.rank === 0);
    expect(card.abilityTextEn.length).toBeGreaterThan(0);
    expect(
      createHash("sha256")
        .update(
          readFileSync(
            new URL(
              `../docs/reference/queens-blood/${card.image}`,
              import.meta.url,
            ),
          ),
        )
        .digest("hex"),
    ).toBe(card.imageSha256);
  }
});

test("coordinate lists agree with each complete five-by-five source diagram", () => {
  for (const card of catalog.cards) {
    expect(card.pattern5x5).toHaveLength(5);
    const expansion: number[][] = [];
    const effects: number[][] = [];
    card.pattern5x5.forEach((line, row) => {
      expect(line).toMatch(/^[.OREB]{5}$/);
      [...line].forEach((cell, column) => {
        if (cell === "R" || cell === "B") expansion.push([row - 2, column - 2]);
        if (cell === "E" || cell === "B") effects.push([row - 2, column - 2]);
      });
    });
    expect(card.pattern5x5[2][2]).toBe("O");
    expect(card.pattern5x5.join("").split("O")).toHaveLength(2);
    expect(card.expansionOffsets).toEqual(expansion);
    expect(card.effectOffsets).toEqual(effects);
  }
});
