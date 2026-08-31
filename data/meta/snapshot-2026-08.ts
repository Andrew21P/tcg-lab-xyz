import { TOP8_ARCHETYPES } from "../archetypes/top8";

export type MetaSnapshot = {
  id: string;
  date: string;
  sourceNote: string;
  /** Field share percent by archetype id (sums ~100). */
  fieldShare: Record<string, number>;
  /** Prior snapshot field share for delta UI. */
  previousFieldShare: Record<string, number>;
  risingCards: { name: string; note: string; deltaSharePts?: number }[];
  techsAfterEvent: { name: string; archetypeIds: string[]; note: string }[];
};

export const META_SNAPSHOT_2026_08: MetaSnapshot = {
  id: "snapshot-2026-08",
  date: "2026-08-15",
  sourceNote:
    "Vendored consensus snapshot for localhost — cite Limitless as data of record",
  fieldShare: {
    "dragapult-ex": 18.5,
    "dragapult-dusknoir": 14.2,
    "dragapult-blaziken": 9.8,
    "festival-lead": 11.4,
    "mega-excadrill-ex": 12.6,
    "ns-zoroark-ex": 10.1,
    "clefairy-box": 8.3,
    "mega-gengar-ex": 9.1,
    other: 6.0,
  },
  previousFieldShare: {
    "dragapult-ex": 22.0,
    "dragapult-dusknoir": 12.5,
    "dragapult-blaziken": 7.2,
    "festival-lead": 13.8,
    "mega-excadrill-ex": 8.4,
    "ns-zoroark-ex": 11.5,
    "clefairy-box": 9.0,
    "mega-gengar-ex": 6.5,
    other: 9.1,
  },
  risingCards: [
    {
      name: "Mega Excadrill ex",
      note: "Mega Evolution tank climbed after regional Top 8 density.",
      deltaSharePts: 4.2,
    },
    {
      name: "Mega Gengar ex",
      note: "Shadow Gate lines punishing slow Stage 2 mirrors.",
      deltaSharePts: 2.6,
    },
    {
      name: "Blaziken ex",
      note: "Fire partner adoption up in Dragapult flex slots.",
      deltaSharePts: 2.1,
    },
    {
      name: "Unfair Stamp",
      note: "ACE SPEC share rising into Item-heavy Festival / Box metas.",
      deltaSharePts: 1.4,
    },
    {
      name: "Crispin",
      note: "Dual-Energy ramp staple for Blaziken and multi-type boxes.",
      deltaSharePts: 1.1,
    },
  ],
  techsAfterEvent: [
    {
      name: "Maximum Belt",
      archetypeIds: ["dragapult-ex", "dragapult-blaziken", "mega-excadrill-ex"],
      note: "Post-event tech to push OHKOs on opposing ex Active Pokémon.",
    },
    {
      name: "Phantom Arena",
      archetypeIds: ["mega-gengar-ex", "mega-excadrill-ex", "clefairy-box"],
      note: "Softens Mega KO prize trades; saw spikes after Mega Evolution Challenge.",
    },
    {
      name: "Hero's Bond",
      archetypeIds: ["mega-gengar-ex"],
      note: "Dedicated Mega tutor replacing a Nest Ball in candy-heavy lists.",
    },
    {
      name: "Team Rocket's Mewtwo ex",
      archetypeIds: ["ns-zoroark-ex"],
      note: "Hand-size payoff after mirrored Iono wars.",
    },
    {
      name: "Briar",
      archetypeIds: ["dragapult-dusknoir", "mega-excadrill-ex", "mega-gengar-ex"],
      note: "Endgame prize math when opponent sits on exactly 2 prizes.",
    },
  ],
};

/** Convenience: deltas vs previousFieldShare in percentage points. */
export function getFieldShareDeltas(
  snapshot: MetaSnapshot = META_SNAPSHOT_2026_08,
): Record<string, number> {
  const out: Record<string, number> = {};
  const ids = new Set([
    ...Object.keys(snapshot.fieldShare),
    ...Object.keys(snapshot.previousFieldShare),
  ]);
  for (const id of ids) {
    out[id] = (snapshot.fieldShare[id] ?? 0) - (snapshot.previousFieldShare[id] ?? 0);
  }
  return out;
}

export function getArchetypeFieldShare(
  archetypeId: string,
  snapshot: MetaSnapshot = META_SNAPSHOT_2026_08,
): number {
  return snapshot.fieldShare[archetypeId] ?? 0;
}

/** Sanity: every top-8 id appears in the snapshot share table. */
export function assertSnapshotCoversTop8(
  snapshot: MetaSnapshot = META_SNAPSHOT_2026_08,
): boolean {
  return TOP8_ARCHETYPES.every((a) => archetypeIdInShare(snapshot, a.id));
}

function archetypeIdInShare(snapshot: MetaSnapshot, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(snapshot.fieldShare, id);
}
