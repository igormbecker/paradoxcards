export type Player = 0 | 1;
export interface Card {
  readonly id: string;
  readonly name: string;
  readonly rank: number;
  readonly power: number;
  readonly reach: readonly (readonly [number, number])[];
}
export interface Cell {
  owner: Player | null;
  rank: number;
  unit: Card | null;
}
export interface State {
  board: Cell[];
}
export interface GameEvent {
  type: "card-placed" | "territory-changed";
  index: number;
}
export interface Result {
  ok: boolean;
  state: State;
  events: GameEvent[];
}
export function createState(): State {
  return {
    board: Array.from({ length: 15 }, (_, i) => ({
      owner: i % 5 === 0 ? 0 : i % 5 === 4 ? 1 : null,
      rank: i % 5 === 0 || i % 5 === 4 ? 1 : 0,
      unit: null,
    })),
  };
}
export function canPlace(
  state: State,
  player: Player,
  card: Card,
  index: number,
): boolean {
  const cell = state.board[index];
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < 15 &&
    !!cell &&
    cell.owner === player &&
    cell.unit === null &&
    cell.rank >= card.rank
  );
}
export function placeCard(
  state: State,
  player: Player,
  card: Card,
  index: number,
): Result {
  if (!canPlace(state, player, card, index))
    return { ok: false, state, events: [] };
  const board = state.board.map((cell) => ({ ...cell }));
  board[index].unit = card;
  const events: GameEvent[] = [{ type: "card-placed", index }];
  const row = Math.floor(index / 5),
    col = index % 5;
  for (const [dr, dc] of card.reach) {
    const r = row + dr,
      c = col + dc * (player === 0 ? 1 : -1);
    if (r < 0 || r >= 3 || c < 0 || c >= 5) continue;
    const target = r * 5 + c,
      cell = board[target];
    if (cell.unit) continue;
    cell.rank =
      cell.owner === player
        ? Math.min(3, cell.rank + 1)
        : cell.owner === null
          ? 1
          : cell.rank;
    cell.owner = player;
    events.push({ type: "territory-changed", index: target });
  }
  return { ok: true, state: { board }, events };
}
