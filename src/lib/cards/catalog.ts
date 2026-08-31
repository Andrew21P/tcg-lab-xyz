import type { RoleTag, TcgCard, TcgSet } from "../types";
import rawCards from "../../../data/cards/cards.json";
import rawSets from "../../../data/cards/sets.json";
import annotations from "../../../data/cards/annotations.json";
import staplesOverlay from "../../../data/cards/staples-overlay.json";

/** Legacy map kept for callers that build image URLs manually. */
export const SET_IMAGE_IDS: Record<string, string> = {
  TEF: "sv5",
  TWM: "sv6",
  SFA: "sv6pt5",
  SCR: "sv7",
  SSP: "sv8",
  PRE: "sv8pt5",
  JTG: "sv9",
  DRI: "sv10",
  BLK: "zsv10pt5",
  WHT: "rsv10pt5",
  MEG: "me1",
  PFL: "me2",
  ASC: "me2pt5",
  POR: "me3",
  CRI: "me4",
  PBL: "me5",
  SVP: "svp",
  "PR-SV": "svp",
  SVE: "sve",
  MEP: "mep",
};

type Ann = {
  name: string;
  setCode: string;
  number: string;
  roles?: RoleTag[];
  whenGood?: string;
  whenBrick?: string;
  scripted?: boolean;
};

type RawCard = TcgCard & {
  apiId?: string;
  setId?: string;
};

function normName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ");
}

function normNum(n: string): string {
  return n.replace(/^0+/, "") || n;
}

const annByName = new Map<string, Ann>();
for (const a of annotations as Ann[]) {
  const key = normName(a.name);
  const prev = annByName.get(key);
  if (!prev || a.scripted) annByName.set(key, a);
}

function applyAnnotations(card: RawCard): TcgCard {
  const hit = annByName.get(normName(card.name));
  if (!hit) return card;
  return {
    ...card,
    roles: hit.roles ?? card.roles,
    whenGood: hit.whenGood ?? card.whenGood,
    whenBrick: hit.whenBrick ?? card.whenBrick,
    scripted: hit.scripted ?? card.scripted,
  };
}

const synced = (rawCards as RawCard[]).map(applyAnnotations);
const namesPresent = new Set(synced.map((c) => normName(c.name)));
const usedIds = new Set(synced.map((c) => c.id.toLowerCase()));

/** Fill gaps pokemon-tcg-data is missing (Nest Ball, Iono, etc.) */
const gapFills = (staplesOverlay as TcgCard[])
  .filter((c) => !namesPresent.has(normName(c.name)))
  .map((c) => {
    let id = c.id;
    if (usedIds.has(id.toLowerCase())) {
      id = `lab-${normName(c.name).replace(/[^a-z0-9]+/g, "-")}`;
    }
    usedIds.add(id.toLowerCase());
    return applyAnnotations({
      ...c,
      id,
      setId: c.setId ?? SET_IMAGE_IDS[c.setCode],
      legalities: c.legalities ?? { standard: "Legal" },
    });
  });

export const CARDS: TcgCard[] = [...synced, ...gapFills];

/** Old Limitless/PTCGO-style ids → current catalog id */
export const CARD_ID_ALIASES: Record<string, string> = {};

function prefer(cards: TcgCard[]): TcgCard | undefined {
  return cards.find((c) => c.scripted) ?? cards[0];
}

for (const a of annotations as Ann[]) {
  const matches = CARDS.filter((c) => normName(c.name) === normName(a.name));
  const target = prefer(matches);
  if (!target) continue;
  const keys = [
    `${a.setCode}-${a.number}`,
    `${a.setCode}-${normNum(a.number)}`,
    `${a.setCode.toLowerCase()}-${a.number}`,
    `${a.setCode.toLowerCase()}-${normNum(a.number)}`,
  ];
  for (const k of keys) {
    const lower = k.toLowerCase();
    if (lower === target.id.toLowerCase()) continue;
    const occupant = CARDS.find((c) => c.id.toLowerCase() === lower);
    // Skip Limitless-number collisions with a different English print
    if (occupant && normName(occupant.name) !== normName(a.name)) continue;
    CARD_ID_ALIASES[lower] = target.id;
  }
}

// Also alias overlay ids when they do not collide with a different print
for (const overlay of staplesOverlay as TcgCard[]) {
  const matches = CARDS.filter((c) => normName(c.name) === normName(overlay.name));
  const target = prefer(matches);
  if (!target) continue;
  const lower = overlay.id.toLowerCase();
  if (lower === target.id.toLowerCase()) continue;
  const occupant = CARDS.find((c) => c.id.toLowerCase() === lower);
  if (occupant && normName(occupant.name) !== normName(overlay.name)) continue;
  CARD_ID_ALIASES[lower] = target.id;
}

export const SETS: TcgSet[] = (rawSets as TcgSet[]).map((set) => ({
  ...set,
  legalCardCount: CARDS.filter((c) => c.setCode === set.code && c.apiId).length ||
    CARDS.filter((c) => c.setCode === set.code).length,
}));
