import type { Ability } from "./abilities";
import { affectedIndices, resolveEffects } from "./effects";
export type Player = 0 | 1;
export interface Card {
  readonly id: string;
  readonly name: string;
  readonly rank: number;
  readonly power: number;
  readonly reach: readonly (readonly [number, number])[];
  readonly effectOffsets?: readonly (readonly [number, number])[];
  readonly placementType?: "rank" | "replacement";
  readonly abilityText?: string;
  readonly ability?: Ability;
  readonly image?: string;
  readonly basePower?: number;
  readonly modifier?: number;
  readonly triggered?: readonly string[];
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
  type:
    "card-placed" | "territory-changed" | "card-destroyed" | "power-changed";
  index: number;
}
export interface Result {
  ok: boolean;
  state: State;
  events: GameEvent[];
  generated?: [Card[], Card[]];
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
    (card.placementType === "replacement"
      ? cell.unit !== null
      : cell.unit === null && cell.rank >= card.rank)
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
  const board = state.board.map((cell) => ({
    ...cell,
    unit: cell.unit ? { ...cell.unit } : null,
  }));
  const replaced = board[index].unit;
  board[index].unit = card.ability
    ? {
        ...card,
        basePower: card.basePower ?? card.power,
        modifier: card.modifier ?? 0,
        triggered: [],
      }
    : card;
  const events: GameEvent[] = [{ type: "card-placed", index }];
  for (const target of affectedIndices(card.reach, index, player)) {
    const cell = board[target];
    if (cell.unit) continue;
    cell.rank =
      cell.owner === player
        ? Math.min(
            3,
            cell.rank +
              (card.ability?.kind === "rank" ? card.ability.amount! : 1),
          )
        : cell.owner === null
          ? card.ability?.kind === "rank"
            ? Math.min(3, card.ability.amount!)
            : 1
          : cell.rank;
    cell.owner = player;
    events.push({ type: "territory-changed", index: target });
  }
  const generated = resolveEffects(board, index, player, replaced, events);
  return { ok: true, state: { board }, events, generated };
}
