import type { Card } from "./placement";
// Fixtures de desenvolvimento: não são equivalentes validados das cartas originais.
export const cards: readonly Card[] = [
  {
    id: "wanderer",
    name: "Era Wanderer",
    rank: 1,
    power: 2,
    reach: [
      [0, 1],
      [-1, 0],
      [1, 0],
    ],
  },
  {
    id: "sentinel",
    name: "Bronze Sentinel",
    rank: 1,
    power: 3,
    reach: [[0, 1]],
  },
  {
    id: "archivist",
    name: "Archive Guardian",
    rank: 2,
    power: 5,
    reach: [
      [-1, 1],
      [0, 1],
      [1, 1],
    ],
  },
];
