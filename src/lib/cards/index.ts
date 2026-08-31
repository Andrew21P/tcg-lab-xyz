import type { EnergyType, RoleTag, TcgCard, TcgSet } from "../types";
import { CARDS, SETS, CARD_ID_ALIASES } from "./catalog";

export { CARDS, SETS, SET_IMAGE_IDS, CARD_ID_ALIASES } from "./catalog";
export { ROLE_LABELS, getRoleColor } from "./roles";
export { FORMAT } from "../format";

export function getAllCards(): TcgCard[] {
  return CARDS;
}

export function getAllSets(): TcgSet[] {
  return SETS;
}

export function getCardById(id: string): TcgCard | undefined {
  const needle = id.trim().toLowerCase();
  const exact = CARDS.find((c) => c.id.toLowerCase() === needle);
  if (exact) return exact;

  const alias = CARD_ID_ALIASES[needle];
  if (alias) {
    const hit = CARDS.find((c) => c.id.toLowerCase() === alias.toLowerCase());
    if (hit) return hit;
  }

  const byApi = CARDS.find((c) => c.apiId?.toLowerCase() === needle);
  if (byApi) return byApi;

  const m = /^([a-z0-9-]+)-(.+)$/i.exec(needle);
  if (!m) return undefined;
  const setPart = m[1]!;
  const bare = m[2]!.replace(/^0+/, "") || m[2]!;
  return CARDS.find((c) => {
    const idBare = c.number.replace(/^0+/, "") || c.number;
    const setOk =
      c.setCode.toLowerCase() === setPart ||
      c.setId?.toLowerCase() === setPart;
    return setOk && idBare === bare;
  });
}

export function getCardsBySet(code: string): TcgCard[] {
  const needle = code.trim().toUpperCase();
  const inSet = CARDS.filter((c) => c.setCode.toUpperCase() === needle);
  // Prefer English pool prints (have apiId). Gap-fill staples keep engine coverage
  // without polluting expansion browsers with Limitless-number stubs.
  const pooled = inSet.filter((c) => !!c.apiId);
  return pooled.length > 0 ? pooled : inSet;
}

export function getLegalSets(): TcgSet[] {
  return SETS.filter((s) => s.legalCardCount > 0);
}

export function getCardsByName(name: string): TcgCard[] {
  const needle = normalizeName(name);
  return CARDS.filter((c) => normalizeName(c.name) === needle);
}

export function isAceSpec(card: TcgCard): boolean {
  return (
    card.subtypes.some((s) => s.toUpperCase() === "ACE SPEC") ||
    card.roles?.includes("ace-spec") === true
  );
}

export function isBasicPokemon(card: TcgCard): boolean {
  return card.supertype === "Pokémon" && card.subtypes.includes("Basic");
}

export function isBasicEnergy(card: TcgCard): boolean {
  return card.supertype === "Energy" && card.subtypes.includes("Basic");
}

export function getStaples(): TcgCard[] {
  return CARDS.filter(
    (c) =>
      c.scripted === true ||
      c.roles?.includes("engine") === true ||
      c.roles?.includes("ace-spec") === true,
  );
}

export function getScriptedCards(): TcgCard[] {
  return CARDS.filter((c) => c.scripted === true);
}

export type CardSearchFilters = {
  setCode?: string;
  setCodes?: string[];
  supertype?: TcgCard["supertype"];
  regulationMark?: string;
  role?: RoleTag;
  roles?: RoleTag[];
  scripted?: boolean;
  type?: EnergyType;
  types?: EnergyType[];
  aceSpec?: boolean;
  name?: string;
};

export function searchCards(query = "", filters: CardSearchFilters = {}): TcgCard[] {
  const q = query.trim().toLowerCase();
  return CARDS.filter((card) => {
    if (q) {
      const hay = `${card.name} ${card.setCode} ${card.number} ${card.id} ${card.subtypes.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.name && normalizeName(card.name) !== normalizeName(filters.name)) {
      return false;
    }
    if (filters.setCode && card.setCode.toUpperCase() !== filters.setCode.toUpperCase()) {
      return false;
    }
    if (filters.setCodes?.length) {
      const allowed = new Set(filters.setCodes.map((c) => c.toUpperCase()));
      if (!allowed.has(card.setCode.toUpperCase())) return false;
    }
    if (filters.supertype && card.supertype !== filters.supertype) return false;
    if (
      filters.regulationMark &&
      card.regulationMark.toUpperCase() !== filters.regulationMark.toUpperCase()
    ) {
      return false;
    }
    if (filters.role && !card.roles?.includes(filters.role)) return false;
    if (filters.roles?.length && !filters.roles.some((r) => card.roles?.includes(r))) {
      return false;
    }
    if (filters.scripted !== undefined && card.scripted !== filters.scripted) return false;
    if (filters.type && !card.types?.includes(filters.type)) return false;
    if (filters.types?.length && !filters.types.some((t) => card.types?.includes(t))) {
      return false;
    }
    if (filters.aceSpec !== undefined && isAceSpec(card) !== filters.aceSpec) return false;
    return true;
  });
}

/**
 * Resolve a deck-list line name to a catalog card.
 * Prefer exact set+number, then set+name, then unique name match.
 */
export function resolveCardName(
  name: string,
  set?: string,
  number?: string,
): TcgCard | undefined {
  const needle = normalizeName(name);
  let candidates = CARDS.filter((c) => normalizeName(c.name) === needle);

  if (set) {
    const setCode = set.trim().toUpperCase();
    candidates = candidates.filter((c) => c.setCode.toUpperCase() === setCode);
  }

  if (number) {
    const num = number.trim().replace(/^0+/, "") || "0";
    const byNumber = candidates.filter(
      (c) => c.number.replace(/^0+/, "") === num || c.number === number.trim(),
    );
    if (byNumber.length === 1) return byNumber[0];
    if (byNumber.length > 1) return preferScripted(byNumber);
    // If set+number miss, fall through to name-only among set-filtered
  }

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) return preferScripted(candidates);

  // Soft match: starts-with / includes for abbreviated import names
  if (!set && !number) {
    const soft = CARDS.filter((c) => {
      const n = normalizeName(c.name);
      return n === needle || n.startsWith(needle) || needle.startsWith(n);
    });
    if (soft.length === 1) return soft[0];
    if (soft.length > 1) return preferScripted(soft);
  }

  return undefined;
}

function preferScripted(cards: TcgCard[]): TcgCard {
  return cards.find((c) => c.scripted) ?? cards[0];
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ");
}
