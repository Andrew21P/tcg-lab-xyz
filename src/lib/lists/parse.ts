import type { DeckEntry, TcgCard } from "@/lib/types";
import { isAceSpec, resolveCardName } from "@/lib/cards";

export type ParseDeckResult = {
  entries: DeckEntry[];
  errors: string[];
  warnings: string[];
};

const SECTION_RE = /^(Pok[eé]mon|Trainer|Energy)\s*:\s*\d+/i;
const COUNT_LINE_RE =
  /^(\d+)\s+(.+?)(?:\s+([A-Z]{2,4})\s+(\d+[a-zA-Z]?))?\s*$/;
/** PTCGL: "4 Ultra Ball SVI 196" or "4 Psychic Energy" */
const PTCGL_LINE_RE =
  /^(\d+)\s+(.+?)(?:\s+([A-Z]{2,5})\s+(\d+[a-zA-Z]?))?\s*$/;

/**
 * Parse Limitless "Copy as Text" and PTCGL export formats.
 */
export function parseDeckList(text: string): ParseDeckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = new Map<string, { count: number; card: TcgCard }>();

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith("//"));

  for (const line of lines) {
    if (SECTION_RE.test(line)) continue;
    if (/^(Total|Deck)\b/i.test(line)) continue;

    const m = line.match(COUNT_LINE_RE) ?? line.match(PTCGL_LINE_RE);
    if (!m) {
      // Name-only trainer lines without count → assume 1
      const soft = resolveCardName(line);
      if (soft) {
        addCount(counts, soft, 1);
        warnings.push(`Assumed count 1 for: ${line}`);
        continue;
      }
      errors.push(`Could not parse line: ${line}`);
      continue;
    }

    const count = Number(m[1]);
    let name = m[2]!.trim();
    const setCode = m[3];
    const number = m[4];

    // Strip trailing set codes glued without space variants
    name = name.replace(/\s+/g, " ").trim();

    const card = resolveCardName(name, setCode, number);
    if (!card) {
      // Retry name-only
      const byName = resolveCardName(name);
      if (byName) {
        addCount(counts, byName, count);
        warnings.push(`Resolved ${name} without set match → ${byName.id}`);
      } else {
        errors.push(`Unknown card: ${line}`);
      }
      continue;
    }
    addCount(counts, card, count);
  }

  const entries = [...counts.values()].map(({ count, card }) => ({ count, card }));
  return { entries, errors, warnings };
}

function addCount(
  map: Map<string, { count: number; card: TcgCard }>,
  card: TcgCard,
  count: number,
): void {
  const prev = map.get(card.id);
  if (prev) prev.count += count;
  else map.set(card.id, { count, card });
}

export type ValidateDeckResult = {
  ok: boolean;
  errors: string[];
  total: number;
  pokemon: number;
  trainer: number;
  energy: number;
  aceSpecs: number;
};

export function validateDeck(entries: DeckEntry[]): ValidateDeckResult {
  const errors: string[] = [];
  let pokemon = 0;
  let trainer = 0;
  let energy = 0;
  let aceSpecs = 0;
  let total = 0;

  for (const e of entries) {
    total += e.count;
    if (e.count < 1 || e.count > 4) {
      // Basic Energy can exceed 4
      if (!(e.card.supertype === "Energy" && e.card.subtypes.includes("Basic"))) {
        if (e.count > 4) errors.push(`${e.card.name}: count ${e.count} exceeds 4`);
      }
    }
    if (e.card.supertype === "Pokémon") pokemon += e.count;
    else if (e.card.supertype === "Trainer") trainer += e.count;
    else if (e.card.supertype === "Energy") energy += e.count;

    if (isAceSpec(e.card)) {
      aceSpecs += e.count;
      if (e.count > 1) errors.push(`ACE SPEC ${e.card.name}: at most 1`);
    }
  }

  if (aceSpecs > 1) errors.push(`Deck has ${aceSpecs} ACE SPEC cards (max 1 total)`);
  if (total !== 60) errors.push(`Deck has ${total} cards (must be 60)`);

  return {
    ok: errors.length === 0,
    errors,
    total,
    pokemon,
    trainer,
    energy,
    aceSpecs,
  };
}

/** Alias */
export const parse = parseDeckList;
