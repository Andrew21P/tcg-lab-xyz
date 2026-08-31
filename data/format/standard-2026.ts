/** 2026–27 Standard format of record for TCG Lab XYZ */

export const FORMAT_ID = "standard-2026";
export const FORMAT_NAME = "2026–27 Standard";

/** Legal regulation marks (G rotated out). */
export const LEGAL_MARKS = ["H", "I", "J", "K"] as const;
export type RegulationMark = (typeof LEGAL_MARKS)[number] | string;

export const ROTATION = {
  liveEffective: "2026-03-26",
  paperEffective: "2026-04-10",
  /** Next rotation unknown — null means “legal this season”. */
  nextRotation: null as string | null,
  rotatedMarks: ["G"] as const,
};

export const BANNED_CARD_IDS: string[] = [];

/** Waiting period for brand-new sets (days after release). */
export const TOURNAMENT_WAITING_DAYS = 14;

export const FORMAT_RULES = [
  "60-card deck",
  "At least 1 Pokémon",
  "Max 4 of any card name (Basic Energy unlimited)",
  "Max 1 ACE SPEC",
  "Regulation marks H, I, J, and later",
  "Best-of-3 at premier events",
] as const;

export function isMarkLegal(mark: string | undefined | null): boolean {
  if (!mark) return false;
  const m = mark.toUpperCase();
  // H and later — treat any mark >= H as legal for forward compatibility
  return m >= "H" && m <= "Z";
}

export function isCardStandardLegal(opts: {
  regulationMark?: string | null;
  legalities?: { standard?: string };
  id?: string;
}): boolean {
  if (opts.id && BANNED_CARD_IDS.includes(opts.id)) return false;
  if (opts.legalities?.standard === "Banned") return false;
  if (opts.legalities?.standard === "Legal") return true;
  return isMarkLegal(opts.regulationMark);
}
