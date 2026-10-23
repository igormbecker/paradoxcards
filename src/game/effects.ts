import type { Ability, Target } from "./abilities";
import type { Card, Cell, GameEvent, Player } from "./placement";
import { tokenCard } from "./tokens";

export const affectedIndices = (
  offsets: Card["reach"],
  index: number,
  player: Player,
) =>
  offsets.flatMap(([dr, dc]) => {
    const row = Math.floor(index / 5) + dr;
    const col = (index % 5) + dc * (player === 0 ? 1 : -1);
    return row >= 0 && row < 3 && col >= 0 && col < 5 ? [row * 5 + col] : [];
  });
const matches = (
  target: Target | undefined,
  owner: Player,
  other: Player | null,
) =>
  other !== null &&
  (target === "both" ||
    (target === "enemy" ? other !== owner : other === owner));
const base = (card: Card) => card.basePower ?? card.power;
interface Work {
  card: Card;
  index: number;
  owner: Player;
  trigger: Ability["trigger"];
  replacedPower?: number;
}

export function resolveEffects(
  board: Cell[],
  index: number,
  owner: Player,
  replaced: Card | null,
  events: GameEvent[],
) {
  const generated: [Card[], Card[]] = [[], []];
  const queue: Work[] = [];
  const placed = board[index].unit!;
  const grow = (
    event: "played" | "destroyed",
    eventOwner: Player,
    except: number,
  ) => {
    board.forEach((cell, i) => {
      const unit = cell.unit,
        ability = unit?.ability;
      if (
        i !== except &&
        unit &&
        cell.owner !== null &&
        ability?.kind === "growth" &&
        ability.event === event &&
        matches(ability.target, cell.owner, eventOwner)
      )
        cell.unit = {
          ...unit,
          modifier: (unit.modifier ?? 0) + ability.amount!,
        };
    });
  };
  const death = (card: Card, i: number, player: Player) => {
    events.push({ type: "card-destroyed", index: i });
    grow("destroyed", player, i);
    queue.push({ card, index: i, owner: player, trigger: "destroyed" });
  };
  const destroy = (i: number) => {
    const cell = board[i];
    if (cell.unit && cell.owner !== null) {
      const unit = cell.unit;
      cell.unit = null;
      cell.rank = 1;
      death(unit, i, cell.owner);
    }
  };
  grow("played", owner, index);
  if (replaced) death(replaced, index, owner);
  queue.push({
    card: placed,
    index,
    owner,
    trigger: placed.placementType === "replacement" ? "replacement" : "play",
    replacedPower: replaced?.power,
  });

  const refresh = () => {
    let changed = false;
    // Auras are recalculated from printed power plus permanent changes; never accumulated.
    const aura = board.map(() => 0);
    board.forEach((cell, i) => {
      const unit = cell.unit,
        ability = unit?.ability;
      if (
        !unit ||
        cell.owner === null ||
        !ability ||
        !["aura", "two-face"].includes(ability.kind)
      )
        return;
      const amount =
        ability.kind === "two-face"
          ? unit.power > base(unit)
            ? 4
            : unit.power < base(unit)
              ? -4
              : 0
          : ability.amount!;
      for (const target of affectedIndices(
        unit.effectOffsets ?? [],
        i,
        cell.owner,
      ))
        if (
          board[target].unit &&
          matches(ability.target, cell.owner, board[target].owner)
        )
          aura[target] += amount;
    });
    const raw = board.map((cell, i) =>
      cell.unit ? base(cell.unit) + (cell.unit.modifier ?? 0) + aura[i] : 0,
    );
    board.forEach((cell, i) => {
      const unit = cell.unit;
      if (!unit || cell.owner === null) return;
      const ability = unit.ability;
      let power = raw[i];
      if (ability?.kind === "count") {
        const count = board.filter(
          (other, j) =>
            j !== i &&
            other.unit &&
            matches(ability.target, cell.owner!, other.owner) &&
            (ability.status === "either"
              ? raw[j] !== base(other.unit)
              : ability.status === "enhanced"
                ? raw[j] > base(other.unit)
                : raw[j] < base(other.unit)),
        ).length;
        power += count * ability.amount!;
      }
      const triggered = [...(unit.triggered ?? [])];
      const trigger = ability?.trigger;
      if (
        (trigger === "enhanced" && power > base(unit)) ||
        (trigger === "enfeebled" && power < base(unit)) ||
        (trigger === "seven" && power >= 7)
      ) {
        if (!triggered.includes(trigger!)) {
          triggered.push(trigger!);
          queue.push({ card: unit, index: i, owner: cell.owner, trigger });
        }
      }
      if (
        power !== unit.power ||
        triggered.length !== (unit.triggered?.length ?? 0)
      ) {
        cell.unit = { ...unit, power, basePower: base(unit), triggered };
        changed = true;
      }
    });
    // Simultaneous lethal damage removes all victims before their death abilities resolve.
    const lethal = board.flatMap((cell, i) =>
      cell.unit && cell.unit.power <= 0 ? [i] : [],
    );
    for (const i of lethal) destroy(i);
    return changed || lethal.length > 0;
  };

  const execute = (work: Work) => {
    const { card, owner: player, index: source, trigger } = work;
    const ability = card.ability;
    if (
      !ability ||
      (ability.trigger !== trigger &&
        ability.kind !== "spawn" &&
        ability.kind !== "rank")
    )
      return;
    if (ability.kind === "generate") {
      generated[player].push(...ability.tokens!.map(tokenCard));
      return;
    }
    if (ability.kind === "spawn" && trigger === "play") {
      board.forEach((cell) => {
        if (cell.owner !== player || cell.unit || !cell.rank) return;
        const family = ability.tokens![0];
        const token = tokenCard(
          family === "hype-johnny" ? `hype-johnny-${cell.rank}` : family,
        );
        const power = family === "diamond-dust" ? cell.rank * 2 : token.power;
        cell.unit = {
          ...token,
          power,
          basePower: power,
          ability:
            family === "elemental"
              ? { ...token.ability!, amount: cell.rank }
              : token.ability,
          abilityText:
            family === "elemental"
              ? token.abilityText!.replace("by 1", `by ${cell.rank}`)
              : token.abilityText,
        };
      });
      return;
    }
    if (ability.kind === "rank" && trigger === "play") return; // expansion was resolved by placement.
    if (ability.kind !== "power" && ability.kind !== "destroy") return;
    const inherited = work.replacedPower ?? 0;
    const amount =
      trigger === "replacement"
        ? card.abilityText?.includes("lower")
          ? -inherited
          : inherited
        : ability.amount!;
    for (const target of affectedIndices(
      card.effectOffsets ?? [],
      source,
      player,
    )) {
      const cell = board[target];
      if (!cell.unit || !matches(ability.target, player, cell.owner)) continue;
      if (ability.kind === "destroy") destroy(target);
      else
        cell.unit = {
          ...cell.unit,
          modifier: (cell.unit.modifier ?? 0) + amount,
        };
      events.push({ type: "power-changed", index: target });
    }
  };
  // Every one-shot trigger is recorded on its instance, every destroyed card is removed.
  // Therefore the queue is finite even when death effects trigger other death effects.
  while (queue.length) {
    execute(queue.shift()!);
    const seen = new Set<string>();
    while (refresh()) {
      const signature = JSON.stringify(board);
      if (seen.has(signature))
        throw new Error("Continuous effects did not reach a stable state.");
      seen.add(signature);
    }
  }
  return generated;
}
