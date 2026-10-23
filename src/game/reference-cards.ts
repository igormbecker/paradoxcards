import { compileAbility } from "./abilities";
import { referenceData } from "./reference-data";
import type { Card } from "./placement";

export const referenceCards: readonly Card[] = referenceData.map((card) => ({
  ...card,
  ability: compileAbility(card.abilityText, card.placementType),
}));
export const referenceCard = (id: string) =>
  referenceCards.find((card) => card.id === id);
