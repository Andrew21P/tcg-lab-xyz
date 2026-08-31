import type { DeckEntry } from "@/lib/types";
import { isAceSpec, isBasicPokemon } from "@/lib/cards";
import { createRng } from "@/lib/engine/rng";
import { SIM_CAVEAT } from "@/lib/types";

export type ConsistencyReport = {
  trials: number;
  mulliganRate: number;
  attackTurn1Rate: number;
  attackTurn2Rate: number;
  energyFloodRate: number;
  energyStarveRate: number;
  prizeLock: {
    rareCandy: number;
    boss: number;
    aceSpec: number;
  };
  openingHandBasicsAvg: number;
  caveat: string;
};

function hypergeometric(
  deckSize: number,
  successesInDeck: number,
  draw: number,
  atLeast: number,
): number {
  if (successesInDeck <= 0 || draw <= 0) return 0;
  // P(X >= atLeast) via enumeration
  let p = 0;
  for (let k = atLeast; k <= Math.min(draw, successesInDeck); k++) {
    p +=
      (comb(successesInDeck, k) * comb(deckSize - successesInDeck, draw - k)) /
      comb(deckSize, draw);
  }
  return p;
}

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 1; i <= k; i++) {
    r *= n - k + i;
    r /= i;
  }
  return r;
}

function expandIds(entries: DeckEntry[]): string[] {
  const ids: string[] = [];
  for (const e of entries) {
    for (let i = 0; i < e.count; i++) ids.push(e.card.id);
  }
  return ids;
}

function cardMeta(entries: DeckEntry[]) {
  const byId = new Map(entries.map((e) => [e.card.id, e.card]));
  return {
    isBasic: (id: string) => {
      const c = byId.get(id);
      return c ? isBasicPokemon(c) : false;
    },
    isEnergy: (id: string) => byId.get(id)?.supertype === "Energy",
    name: (id: string) => byId.get(id)?.name ?? "",
    card: (id: string) => byId.get(id),
  };
}

/**
 * Opening-hand / prize-lock consistency report via seeded trials + hypergeometric.
 */
export function runConsistencyReport(
  entries: DeckEntry[],
  opts?: { trials?: number; seed?: number },
): ConsistencyReport {
  const trials = opts?.trials ?? 400;
  const rng = createRng(opts?.seed ?? 42);
  const ids = expandIds(entries);
  const meta = cardMeta(entries);
  const deckSize = ids.length || 60;

  let mulligans = 0;
  let basicsSum = 0;
  let energyFlood = 0;
  let energyStarve = 0;
  let atk1 = 0;
  let atk2 = 0;

  let candyInPrizes = 0;
  let bossInPrizes = 0;
  let aceInPrizes = 0;

  for (let t = 0; t < trials; t++) {
    const shuffled = rng.shuffle(ids);
    const hand = shuffled.slice(0, 7);
    const prizes = shuffled.slice(7, 13);
    const basics = hand.filter((id) => meta.isBasic(id)).length;
    basicsSum += basics;
    if (basics === 0) mulligans++;

    const energyInHand = hand.filter((id) => meta.isEnergy(id)).length;
    if (energyInHand >= 4) energyFlood++;
    if (energyInHand === 0) energyStarve++;

    // Simplified attack readiness: Basic + Energy in opening 7 → turn-1 attack-ish
    if (basics > 0 && energyInHand > 0) atk1++;
    // Turn 2: look at top 8 after prizes (hand 7 + draw) approx cards 0-7 + 13
    const t2pool = [...hand, shuffled[13]].filter(Boolean) as string[];
    if (
      t2pool.some((id) => meta.isBasic(id)) &&
      t2pool.some((id) => meta.isEnergy(id))
    ) {
      atk2++;
    }

    if (prizes.some((id) => meta.name(id) === "Rare Candy")) candyInPrizes++;
    if (prizes.some((id) => meta.name(id) === "Boss's Orders")) bossInPrizes++;
    if (prizes.some((id) => {
      const c = meta.card(id);
      return c ? isAceSpec(c) : false;
    })) {
      aceInPrizes++;
    }
  }

  // Hypergeometric cross-check for prize lock (blend with trials)
  const countName = (name: string) =>
    entries.filter((e) => e.card.name === name).reduce((s, e) => s + e.count, 0);
  const aceCount = entries.filter((e) => isAceSpec(e.card)).reduce((s, e) => s + e.count, 0);
  const hgCandy = hypergeometric(deckSize, countName("Rare Candy"), 6, 1);
  const hgBoss = hypergeometric(deckSize, countName("Boss's Orders"), 6, 1);
  const hgAce = hypergeometric(deckSize, aceCount, 6, 1);

  return {
    trials,
    mulliganRate: mulligans / trials,
    attackTurn1Rate: atk1 / trials,
    attackTurn2Rate: atk2 / trials,
    energyFloodRate: energyFlood / trials,
    energyStarveRate: energyStarve / trials,
    prizeLock: {
      rareCandy: 0.5 * (candyInPrizes / trials) + 0.5 * hgCandy,
      boss: 0.5 * (bossInPrizes / trials) + 0.5 * hgBoss,
      aceSpec: 0.5 * (aceInPrizes / trials) + 0.5 * hgAce,
    },
    openingHandBasicsAvg: basicsSum / trials,
    caveat: SIM_CAVEAT.text,
  };
}
