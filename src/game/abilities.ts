export type Target = "allied" | "enemy" | "both";
export interface Ability {
  kind:
    | "none"
    | "power"
    | "destroy"
    | "aura"
    | "count"
    | "growth"
    | "rank"
    | "bonus"
    | "party"
    | "generate"
    | "spawn"
    | "two-face";
  trigger?:
    "play" | "destroyed" | "enhanced" | "enfeebled" | "seven" | "replacement";
  target?: Target;
  amount?: number;
  status?: "enhanced" | "enfeebled" | "either";
  event?: "played" | "destroyed";
  tokens?: string[];
}

// Translate the preserved source contract once; unsupported text is never silently ignored.
export function compileAbility(text: string, placementType = "rank"): Ability {
  const lower = text.toLowerCase();
  const amount = Number(lower.match(/(?:by|bonus of) (\d+)/)?.[1] ?? 0);
  const target: Target = lower.includes("allied and enemy")
    ? "both"
    : lower.includes("enemy")
      ? "enemy"
      : "allied";
  const trigger = lower.includes("when destroyed")
    ? "destroyed"
    : lower.includes("first enfeebled")
      ? "enfeebled"
      : lower.includes("first enhanced") ||
          lower.includes("first time this card is enhanced") ||
          lower.includes("first time this card in enhanced")
        ? "enhanced"
        : lower.includes("first reaches 7")
          ? "seven"
          : placementType === "replacement"
            ? "replacement"
            : "play";
  if (
    lower.includes("no abilities") ||
    /surfeit|intimidatingly|gold saucer attraction|crystal-hard|adorable nature/.test(
      lower,
    )
  )
    return { kind: "none" };
  if (lower.startsWith("enhanced:"))
    return { kind: "two-face", amount: 4, target: "both" };
  if (lower.includes("loser of each lane")) return { kind: "party" };
  if (lower.includes("score bonus")) return { kind: "bonus", amount };
  if (lower.includes("position ranks")) return { kind: "rank", amount };
  if (lower.includes("spawn"))
    return {
      kind: "spawn",
      tokens: [
        lower.includes("diamond dust")
          ? "diamond-dust"
          : lower.includes("elemental")
            ? "elemental"
            : "hype-johnny",
      ],
    };
  if (lower.includes("to your hand")) {
    const tokens = lower.includes("mandragora")
      ? ["mandragora-minion"]
      : lower.includes("heatseeker")
        ? ["heatseeker-minion"]
        : lower.includes("baby grangalan")
          ? ["baby-grangalan"]
          : lower.includes("grangalan")
            ? ["grangalan-junior"]
            : lower.includes("amalgam")
              ? ["resurrected-amalgam"]
              : lower.includes("moogle mage")
                ? ["moogle-mage", "moogle-bard"]
                : lower.includes("moogle")
                  ? ["moogle"]
                  : lower.includes("bronco")
                    ? ["tiny-bronco"]
                    : lower.includes("beast")
                      ? ["galian-beast"]
                      : lower.includes("cacneo")
                        ? ["cacneo", "donberry"]
                        : [];
    if (!tokens.length) throw new Error("Unknown generated card: " + text);
    return { kind: "generate", trigger, tokens };
  }
  if (lower.includes("for each"))
    return {
      kind: "count",
      amount,
      target,
      status: lower.includes("enhanced or enfeebled")
        ? "either"
        : lower.includes("enfeebled")
          ? "enfeebled"
          : "enhanced",
    };
  if (lower.includes("raise this card"))
    return {
      kind: "growth",
      amount,
      target,
      event: lower.includes("played from hand") ? "played" : "destroyed",
    };
  if (lower.includes("while this card"))
    return {
      kind: "aura",
      amount: lower.startsWith("lower") ? -amount : amount,
      target,
    };
  if (
    /\bdestroy (?:allied|enemy)/.test(lower) &&
    lower.includes("affected tiles")
  )
    return { kind: "destroy", trigger, target };
  if (placementType === "replacement" && !lower.includes("power"))
    return { kind: "none" };
  if (/raise the power|lower the power/.test(lower))
    return {
      kind: "power",
      trigger,
      amount: lower.includes("lower the power") ? -amount : amount,
      target,
    };
  throw new Error("Unsupported ability: " + text);
}
