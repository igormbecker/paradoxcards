import { referenceCard } from "../game/reference-cards";
export const cardImage = (id: string) => referenceCard(id)?.image;
// Keep persisted provisional matches readable until the player starts a new match.
const identities = [
  "wanderer",
  "sentinel",
  "archivist",
  "fixture-0",
  "fixture-1",
  "fixture-2",
  "fixture-3",
  "fixture-4",
];
export const cardArtFrame = (id: string) => Math.max(0, identities.indexOf(id));
const names = [
  "Era Wanderer",
  "Bronze Sentinel",
  "Archive Guardian",
  "Stone Chronicler",
  "Portal Watcher",
  "Ancestral Echo",
  "Mist Wanderer",
  "Living Clock",
];
// Stored matches may still contain the previous Portuguese fixture names.
export const cardDisplayName = (id: string, fallback: string) => {
  const reference = referenceCard(id);
  if (reference) return reference.name;
  const index = identities.indexOf(id);
  return index === -1 ? fallback : names[index];
};
export const cardArtPosition = (id: string) => {
  const frame = cardArtFrame(id);
  return `${(frame % 4) * (100 / 3)}% ${Math.floor(frame / 4) * 100}%`;
};
