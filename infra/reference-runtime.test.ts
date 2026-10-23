import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { referenceCards } from "../src/game/reference-cards";

it("publishes the captured fronts unchanged and keeps all runtime attributes aligned with the source", () => {
  const source = JSON.parse(
    readFileSync(
      new URL("../docs/reference/queens-blood/cards.json", import.meta.url),
      "utf8",
    ),
  );
  for (const card of referenceCards) {
    const original = source.cards.find(
      (entry: { id: string }) => entry.id === card.id,
    );
    expect(card.name).toBe(original.nameEn);
    expect(card.rank).toBe(original.rank);
    expect(card.power).toBe(original.power);
    expect(card.reach).toEqual(original.expansionOffsets);
    expect(card.effectOffsets).toEqual(original.effectOffsets);
    expect(card.abilityText).toBe(original.abilityTextEn);
    expect(
      createHash("sha256")
        .update(
          readFileSync(new URL("../public" + card.image, import.meta.url)),
        )
        .digest("hex"),
    ).toBe(original.imageSha256);
  }
});
