import type { DeckEntry } from "@/lib/types";
import { getCardsByName, isBasicPokemon, resolveCardName } from "@/lib/cards";
import { TOP8_ARCHETYPES } from "../../../data/archetypes/top8";
import { createRng } from "@/lib/engine/rng";
import { runConsistencyReport } from "./consistency";

export type SwapSuggestion = {
  cut: string;
  add: string;
  deltaEv: number;
  note: string;
};

/**
 * Suggest cuts of dead-draw / high-count techs and adds from archetype tech options.
 */
export function suggestSwaps(
  entries: DeckEntry[],
  metaSlate?: Record<string, number>,
  seed = 7,
): SwapSuggestion[] {
  const rng = createRng(seed);
  const base = runConsistencyReport(entries, { trials: 120, seed });
  const suggestions: SwapSuggestion[] = [];

  // Find high-count trainers tagged dead-draw or brick roles
  const cutCandidates = [...entries]
    .filter(
      (e) =>
        e.count >= 2 &&
        e.card.supertype === "Trainer" &&
        (e.card.roles?.includes("dead-draw") ||
          e.card.roles?.includes("tech") ||
          e.card.name === "Crushing Hammer" ||
          e.card.name === "Poké Ball"),
    )
    .sort((a, b) => b.count - a.count);

  const field = metaSlate ?? Object.fromEntries(TOP8_ARCHETYPES.map((a) => [a.id, 1 / 8]));
  const topArch = [...TOP8_ARCHETYPES].sort(
    (a, b) => (field[b.id] ?? 0) - (field[a.id] ?? 0),
  )[0];

  const addPool = [
    ...(topArch?.techOptions ?? []),
    "Boss's Orders",
    "Counter Catcher",
    "Night Stretcher",
    "Iono",
  ];

  for (const cut of cutCandidates.slice(0, 4)) {
    for (const addName of addPool.slice(0, 6)) {
      if (entries.some((e) => e.card.name === addName && e.count >= 4)) continue;
      if (cut.card.name === addName) continue;
      const addCard =
        resolveCardName(addName) ?? getCardsByName(addName)[0];
      if (!addCard) continue;

      const next = entries.map((e) => ({ ...e, card: e.card }));
      const cutEntry = next.find((e) => e.card.id === cut.card.id);
      if (!cutEntry || cutEntry.count < 1) continue;
      cutEntry.count -= 1;
      if (cutEntry.count === 0) {
        const i = next.indexOf(cutEntry);
        next.splice(i, 1);
      }
      const existing = next.find((e) => e.card.id === addCard.id);
      if (existing) existing.count += 1;
      else next.push({ count: 1, card: addCard });

      // Keep 60
      const total = next.reduce((s, e) => s + e.count, 0);
      if (total !== entries.reduce((s, e) => s + e.count, 0)) continue;

      const trial = runConsistencyReport(next, {
        trials: 80,
        seed: rng.nextInt(1e9),
      });
      const deltaEv =
        (trial.attackTurn2Rate - base.attackTurn2Rate) * 0.4 +
        (base.mulliganRate - trial.mulliganRate) * 0.35 +
        (base.energyStarveRate - trial.energyStarveRate) * 0.15 +
        (base.prizeLock.boss - trial.prizeLock.boss) * -0.1 +
        (rng.next() - 0.5) * 0.02;

      suggestions.push({
        cut: cut.card.name,
        add: addCard.name,
        deltaEv: Math.round(deltaEv * 1000) / 1000,
        note: `Consistency-shaped swap toward ${topArch?.name ?? "meta"} tech.`,
      });
    }
  }

  // Also suggest cutting excess Basics if mulligan is already low
  if (base.mulliganRate < 0.05) {
    const basics = entries.filter((e) => isBasicPokemon(e.card) && e.count >= 4);
    for (const b of basics.slice(0, 1)) {
      suggestions.push({
        cut: b.card.name,
        add: "Boss's Orders",
        deltaEv: 0.01,
        note: "Mulligan already healthy — flex a Basic into gust density.",
      });
    }
  }

  return suggestions
    .sort((a, b) => b.deltaEv - a.deltaEv)
    .slice(0, 12);
}
