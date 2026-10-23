import { expect, it } from "vitest";
import { cardDisplayName } from "./card-art";

it("shows the current English name for a card from a previously saved match", () => {
  const savedCard = { id: "wanderer", name: "Viajante das eras" };
  expect(cardDisplayName(savedCard.id, savedCard.name)).toBe("Era Wanderer");
  expect(savedCard.name).toBe("Viajante das eras");
});
