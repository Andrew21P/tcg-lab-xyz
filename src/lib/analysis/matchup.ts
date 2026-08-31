import type { DeckEntry } from "@/lib/types";
import { SIM_CAVEAT } from "@/lib/types";
import { getArchetypeById, TOP8_ARCHETYPES } from "../../../data/archetypes/top8";
import { resolveCardName } from "@/lib/cards";
import { heuristicAgent, playbookAgent, type Agent } from "@/lib/engine/agents";
import { playGame } from "@/lib/engine/game";
import { createRng } from "@/lib/engine/rng";

export type MatchupResult = {
  games: number;
  g1WinRate: number;
  g2WinRate: number;
  bo3Estimate: number;
  whoWantsG1: "A" | "B" | "either";
  commonLosingLines: string[];
  techMoves: { name: string; rate: number; note: string }[];
  caveat: string;
};

export type MatchupOpts = {
  games?: number;
  seed?: number;
  agentA?: Agent;
  agentB?: Agent;
};

function consensusToEntries(
  list: { count: number; name: string; setCode?: string; number?: string }[],
): DeckEntry[] {
  const entries: DeckEntry[] = [];
  for (const row of list) {
    const card = resolveCardName(row.name, row.setCode, row.number);
    if (!card) continue;
    entries.push({ count: row.count, card });
  }
  // Pad / trim to 60 with Psychic Energy if short
  let total = entries.reduce((s, e) => s + e.count, 0);
  const energy = resolveCardName("Psychic Energy");
  if (energy && total < 60) {
    entries.push({ count: 60 - total, card: energy });
    total = 60;
  }
  while (total > 60 && entries.length) {
    const last = entries[entries.length - 1]!;
    const over = total - 60;
    if (last.count > over) {
      last.count -= over;
      total = 60;
    } else {
      total -= last.count;
      entries.pop();
    }
  }
  return entries;
}

function bo3FromGameWin(p: number): number {
  // P(win bo3) ≈ P(WW) + P(WLW) + P(LWW) = p^2 + 2 p^2 (1-p)
  return p * p * (3 - 2 * p);
}

/**
 * Run head-to-head sims. G1 = A goes first; G2 = B goes first.
 */
export function runMatchup(
  listA: DeckEntry[],
  listB: DeckEntry[],
  opts: MatchupOpts = {},
): MatchupResult {
  const games = opts.games ?? 40;
  const seed = opts.seed ?? 99;
  const agentA = opts.agentA ?? heuristicAgent;
  const agentB = opts.agentB ?? heuristicAgent;
  const rng = createRng(seed);

  let g1Wins = 0;
  let g2Wins = 0;
  const lossTags = new Map<string, number>();
  const techCounts = new Map<string, number>();

  const half = Math.ceil(games / 2);

  for (let i = 0; i < half; i++) {
    const s = rng.nextInt(1e9);
    const r = playGame(listA, listB, s, agentA, agentB, 80);
    if (r.winner === 0) g1Wins++;
    else {
      for (const e of r.log) {
        if (e.tag === "ko" || e.tag === "gust" || e.tag === "disruption") {
          lossTags.set(e.message, (lossTags.get(e.message) ?? 0) + 1);
        }
      }
    }
    tallyTech(r.log, 0, techCounts);
  }

  for (let i = 0; i < games - half; i++) {
    const s = rng.nextInt(1e9);
    // Swap first player via seed setup — playGame always P0 first; swap lists
    const r = playGame(listB, listA, s, agentB, agentA, 80);
    // From A's perspective: A is listB's opponent = player 1
    if (r.winner === 1) g2Wins++;
    else if (r.winner === 0) {
      /* B won on the draw */
    }
    tallyTech(r.log, 1, techCounts);
  }

  const g1n = half;
  const g2n = games - half;
  const g1WinRate = g1n ? g1Wins / g1n : 0;
  const g2WinRate = g2n ? g2Wins / g2n : 0;
  const avg = (g1WinRate + g2WinRate) / 2;

  const whoWantsG1: MatchupResult["whoWantsG1"] =
    Math.abs(g1WinRate - g2WinRate) < 0.05
      ? "either"
      : g1WinRate > g2WinRate
        ? "A"
        : "B";

  const commonLosingLines = [...lossTags.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([msg]) => msg);

  const techMoves = [...techCounts.entries()]
    .map(([name, count]) => ({
      name,
      rate: count / games,
      note: `${name} showed up in ≥3% of games` ,
    }))
    .filter((t) => t.rate >= 0.03)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 8);

  return {
    games,
    g1WinRate,
    g2WinRate,
    bo3Estimate: bo3FromGameWin(avg),
    whoWantsG1,
    commonLosingLines,
    techMoves,
    caveat: SIM_CAVEAT.text,
  };
}

function tallyTech(
  log: { tag: string; message: string; playerIndex: number }[],
  playerIndex: number,
  techCounts: Map<string, number>,
): void {
  for (const e of log) {
    if (e.playerIndex !== playerIndex) continue;
    if (e.tag === "gust" || e.tag === "disruption" || e.tag === "search") {
      const name = e.message.split(/[—→]/)[0]?.trim();
      if (name) techCounts.set(name, (techCounts.get(name) ?? 0) + 1);
    }
  }
}

export function runMatchupVsArchetype(
  list: DeckEntry[],
  archetypeId: string,
  opts: MatchupOpts = {},
): MatchupResult {
  const arch = getArchetypeById(archetypeId);
  if (!arch) {
    return {
      games: 0,
      g1WinRate: 0.5,
      g2WinRate: 0.5,
      bo3Estimate: 0.5,
      whoWantsG1: "either",
      commonLosingLines: [`Unknown archetype ${archetypeId}`],
      techMoves: [],
      caveat: SIM_CAVEAT.text,
    };
  }
  const opp = consensusToEntries(arch.consensusList);
  return runMatchup(list, opp, {
    ...opts,
    agentB: opts.agentB ?? playbookAgent(archetypeId),
  });
}

export type Top8Matrix = {
  ids: string[];
  /** matrix[row][col] = row's win rate vs col (row goes first half the time averaged) */
  winRates: number[][];
  gamesPer: number;
  seed: number;
  caveat: string;
};

export function buildTop8Matrix(seed = 1234, gamesPer = 40): Top8Matrix {
  const ids = TOP8_ARCHETYPES.map((a) => a.id);
  const lists = TOP8_ARCHETYPES.map((a) => consensusToEntries(a.consensusList));
  const winRates: number[][] = ids.map(() => ids.map(() => 0.5));
  const rng = createRng(seed);

  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (i === j) {
        winRates[i]![j] = 0.5;
        continue;
      }
      const r = runMatchup(lists[i]!, lists[j]!, {
        games: gamesPer,
        seed: rng.nextInt(1e9),
        agentA: playbookAgent(ids[i]!),
        agentB: playbookAgent(ids[j]!),
      });
      winRates[i]![j] = (r.g1WinRate + r.g2WinRate) / 2;
    }
  }

  return {
    ids,
    winRates,
    gamesPer,
    seed,
    caveat: SIM_CAVEAT.text,
  };
}
