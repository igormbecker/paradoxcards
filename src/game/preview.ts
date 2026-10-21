import { placeCard, type Card, type Player, type State } from "./placement";
export interface PreviewChange {
  index: number;
  kind: "placement" | "capture" | "rank" | "claim";
}
export interface PlacementPreview {
  state: State;
  changes: PreviewChange[];
}
export function previewPlacement(
  state: State,
  player: Player,
  card: Card,
  index: number,
): PlacementPreview | null {
  const result = placeCard(state, player, card, index);
  if (!result.ok) return null;
  const changes: PreviewChange[] = [];
  result.state.board.forEach((after, i) => {
    const before = state.board[i];
    if (i === index) changes.push({ index: i, kind: "placement" });
    else if (before.owner !== after.owner)
      changes.push({
        index: i,
        kind: before.owner === null ? "claim" : "capture",
      });
    else if (before.rank !== after.rank)
      changes.push({ index: i, kind: "rank" });
  });
  return { state: result.state, changes };
}
