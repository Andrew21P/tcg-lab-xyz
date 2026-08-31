import { META_SNAPSHOT_2026_08, getFieldShareDeltas } from "../../../data/meta/snapshot-2026-08";
import { TOP8_ARCHETYPES } from "../../../data/archetypes/top8";
import { SIM_CAVEAT } from "@/lib/types";

export type FieldEvInput = {
  /** Win rate vs each archetype id (0–1) */
  myMatchups: Record<string, number>;
  /** Field share percent (0–100) or fraction (0–1); auto-detected */
  fieldShare: Record<string, number>;
};

export type FieldEvResult = {
  expectedWinRate: number;
  byArchetype: { id: string; name: string; share: number; winRate: number; contribution: number }[];
  caveat: string;
};

function normalizeShare(fieldShare: Record<string, number>): Record<string, number> {
  const entries = Object.entries(fieldShare);
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  if (sum <= 0) return fieldShare;
  // If looks like percents
  if (sum > 1.5) {
    const out: Record<string, number> = {};
    for (const [k, v] of entries) out[k] = v / 100;
    return out;
  }
  return fieldShare;
}

/**
 * Expected win rate at an event given matchup table × field share.
 */
export function computeFieldEv(input: FieldEvInput): FieldEvResult {
  const share = normalizeShare(input.fieldShare);
  const byArchetype: FieldEvResult["byArchetype"] = [];
  let expected = 0;
  let shareUsed = 0;

  for (const arch of TOP8_ARCHETYPES) {
    const s = share[arch.id] ?? 0;
    const wr = input.myMatchups[arch.id] ?? 0.5;
    const contribution = s * wr;
    expected += contribution;
    shareUsed += s;
    byArchetype.push({
      id: arch.id,
      name: arch.name,
      share: s,
      winRate: wr,
      contribution,
    });
  }

  // Fold "other" if present
  if (share.other) {
    const wr = input.myMatchups.other ?? 0.5;
    expected += share.other * wr;
    shareUsed += share.other;
    byArchetype.push({
      id: "other",
      name: "Other",
      share: share.other,
      winRate: wr,
      contribution: share.other * wr,
    });
  }

  if (shareUsed > 0 && shareUsed < 0.99) {
    // Renormalize lightly
    expected = expected / shareUsed;
  }

  return {
    expectedWinRate: expected,
    byArchetype,
    caveat: SIM_CAVEAT.text,
  };
}

export function risingCards(snapshot = META_SNAPSHOT_2026_08) {
  return snapshot.risingCards;
}

export type MetaInsights = {
  snapshotId: string;
  date: string;
  sourceNote: string;
  risingCards: typeof META_SNAPSHOT_2026_08.risingCards;
  techsAfterEvent: typeof META_SNAPSHOT_2026_08.techsAfterEvent;
  fieldShare: Record<string, number>;
  fieldShareDeltas: Record<string, number>;
  topArchetypeId: string;
  caveat: string;
};

export function getMetaInsights(): MetaInsights {
  const snapshot = META_SNAPSHOT_2026_08;
  const deltas = getFieldShareDeltas(snapshot);
  const topArchetypeId = Object.entries(snapshot.fieldShare)
    .filter(([id]) => id !== "other")
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "dragapult-ex";

  return {
    snapshotId: snapshot.id,
    date: snapshot.date,
    sourceNote: snapshot.sourceNote,
    risingCards: snapshot.risingCards,
    techsAfterEvent: snapshot.techsAfterEvent,
    fieldShare: snapshot.fieldShare,
    fieldShareDeltas: deltas,
    topArchetypeId,
    caveat: SIM_CAVEAT.text,
  };
}
