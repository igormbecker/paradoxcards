import { referenceCards } from "./reference-cards";
import {
  canPlace,
  createState,
  placeCard,
  type Card,
  type Player,
  type State,
  type GameEvent,
} from "./placement";
export interface FinalResult {
  rows: [number, number][];
  total: [number, number];
  winner: Player | null;
}
export interface MatchState extends State {
  hands: [Card[], Card[]];
  decks: [Card[], Card[]];
  turn: Player;
  phase: "opening" | "play" | "ended";
  confirmed: [boolean, boolean];
  random: number;
  passes: number;
  result: FinalResult | null;
}
interface MatchResult {
  ok: boolean;
  state: MatchState;
  events: GameEvent[];
}
function shuffle(
  deck: readonly Card[],
  seed: number,
): { deck: Card[]; seed: number } {
  const result = [...deck];
  let next = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    next = (Math.imul(next, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((next / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return { deck: result, seed: next };
}
export function createMatch(seed = 1): MatchState {
  // All collectible cards are eligible. Keep enough rank-one cards to open a match.
  const deck = (random: number) => {
    const pool = shuffle(referenceCards, random);
    const starters = pool.deck.filter((c) => c.rank === 1).slice(0, 7);
    const others = pool.deck.filter((c) => !starters.includes(c)).slice(0, 8);
    const shuffled = shuffle([...starters, ...others], pool.seed);
    for (let index = 0; index < 2; index++) {
      if (
        shuffled.deck.slice(0, 5).filter((card) => card.rank === 1).length >= 2
      )
        break;
      const from = shuffled.deck.findIndex(
        (card, i) => i >= 5 && card.rank === 1,
      );
      const to = shuffled.deck.findIndex((card, i) => i < 5 && card.rank !== 1);
      [shuffled.deck[from], shuffled.deck[to]] = [
        shuffled.deck[to],
        shuffled.deck[from],
      ];
    }
    return shuffled;
  };
  const a = deck(seed),
    b = deck(a.seed);
  return {
    ...createState(),
    hands: [a.deck.slice(0, 5), b.deck.slice(0, 5)],
    decks: [a.deck.slice(5), b.deck.slice(5)],
    turn: 0,
    phase: "opening",
    confirmed: [false, false],
    random: b.seed,
    passes: 0,
    result: null,
  };
}
const rejected = (state: MatchState): MatchResult => ({
  ok: false,
  state,
  events: [],
});
export function confirmOpening(
  state: MatchState,
  player: Player,
  indices: readonly number[],
): MatchResult {
  if (
    state.phase !== "opening" ||
    state.confirmed[player] ||
    new Set(indices).size !== indices.length ||
    indices.some(
      (i) => !Number.isInteger(i) || i < 0 || i >= state.hands[player].length,
    )
  )
    return rejected(state);
  const hands: [Card[], Card[]] = [[...state.hands[0]], [...state.hands[1]]],
    decks: [Card[], Card[]] = [[...state.decks[0]], [...state.decks[1]]];
  const removed: Card[] = [];
  for (const index of [...indices].sort((a, b) => a - b)) {
    removed.push(hands[player][index]);
    hands[player][index] = decks[player].shift()!;
  }
  const mixed = removed.length
    ? shuffle([...decks[player], ...removed], state.random)
    : { deck: decks[player], seed: state.random };
  decks[player] = mixed.deck;
  const confirmed: [boolean, boolean] = [...state.confirmed];
  confirmed[player] = true;
  const started = confirmed.every(Boolean);
  return {
    ok: true,
    state: {
      ...state,
      hands,
      decks,
      confirmed,
      random: mixed.seed,
      phase: started ? "play" : "opening",
      turn: started ? 0 : confirmed[0] ? 1 : 0,
    },
    events: [],
  };
}
export function canPlay(
  state: MatchState,
  player: Player,
  handIndex: number,
  index: number,
): boolean {
  const card = state.hands[player]?.[handIndex];
  return (
    state.phase === "play" &&
    state.turn === player &&
    Number.isInteger(handIndex) &&
    !!card &&
    canPlace(state, player, card, index)
  );
}
function finish(state: MatchState): MatchState {
  const points = score(state);
  const winner =
    points.total[0] === points.total[1]
      ? null
      : points.total[0] > points.total[1]
        ? 0
        : 1;
  return { ...state, phase: "ended", result: { ...points, winner } };
}
function finishIfExhausted(state: MatchState): MatchState {
  // Replacement cards can still be played on a full board.
  const possible = ([0, 1] as const).some((player) =>
    [...state.hands[player], ...state.decks[player]].some((card) =>
      state.board.some((_, index) => canPlace(state, player, card, index)),
    ),
  );
  return possible ? state : finish(state);
}
function nextTurn(state: MatchState): MatchState {
  const turn: Player = state.turn === 0 ? 1 : 0;
  const hands: [Card[], Card[]] = [[...state.hands[0]], [...state.hands[1]]],
    decks: [Card[], Card[]] = [[...state.decks[0]], [...state.decks[1]]];
  if (decks[turn].length) hands[turn].push(decks[turn].shift()!);
  return { ...state, turn, hands, decks };
}
export function playFromHand(
  state: MatchState,
  player: Player,
  handIndex: number,
  index: number,
): MatchResult {
  if (!canPlay(state, player, handIndex, index)) return rejected(state);
  const placed = placeCard(
    state,
    player,
    state.hands[player][handIndex],
    index,
  );
  const hands: [Card[], Card[]] = [[...state.hands[0]], [...state.hands[1]]];
  hands[player].splice(handIndex, 1);
  hands[0].push(...(placed.generated?.[0] ?? []));
  hands[1].push(...(placed.generated?.[1] ?? []));
  return {
    ok: true,
    state: finishIfExhausted(
      nextTurn({ ...state, ...placed.state, hands, passes: 0 }),
    ),
    events: placed.events,
  };
}
export function passTurn(state: MatchState, player: Player): MatchResult {
  if (state.phase !== "play" || state.turn !== player) return rejected(state);
  const passes = state.passes + 1;
  if (passes >= 2)
    return { ok: true, state: finish({ ...state, passes }), events: [] };
  return {
    ok: true,
    state: finishIfExhausted(nextTurn({ ...state, passes })),
    events: [],
  };
}
export function score(state: State): {
  rows: [number, number][];
  total: [number, number];
} {
  const rows: [number, number][] = [
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  state.board.forEach((cell, i) => {
    if (cell.unit && cell.owner !== null)
      rows[Math.floor(i / 5)][cell.owner] += cell.unit.power;
  });
  const total: [number, number] = [0, 0];
  const party = state.board.some(
    (cell) => cell.unit?.ability?.kind === "party",
  );
  for (const [index, row] of rows.entries()) {
    if (row[0] === row[1]) continue;
    const winner = row[0] > row[1] ? 0 : 1;
    const bonus = state.board
      .slice(index * 5, index * 5 + 5)
      .reduce(
        (sum, cell) =>
          sum +
          (cell.owner === winner && cell.unit?.ability?.kind === "bonus"
            ? cell.unit.ability.amount!
            : 0),
        0,
      );
    total[winner] +=
      row[winner] + bonus + (party ? row[winner === 0 ? 1 : 0] : 0);
  }
  return { rows, total };
}
