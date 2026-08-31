/**
 * Download Standard-legal cards (regulation H+) from PokemonTCG/pokemon-tcg-data
 * into data/cards/*.json for Card Lab.
 *
 * Ignores stale `legalities.standard` flags on rotated SWSH/early-SV sets.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const RAW =
  "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master";
const OUT = join(process.cwd(), "data/cards");

function isMarkLegal(mark: string | undefined): boolean {
  if (!mark) return false;
  const m = mark.toUpperCase();
  return m >= "H" && m <= "Z";
}

function isSvEraSetId(id: string): boolean {
  return (
    id.startsWith("sv") ||
    id.startsWith("me") ||
    id === "sve" ||
    id.startsWith("zsv") ||
    id.startsWith("rsv")
  );
}

function isCardLegal(
  card: {
    regulationMark?: string;
    supertype?: string;
    subtypes?: string[];
    legalities?: { standard?: string };
  },
  setId: string,
): boolean {
  if (card.legalities?.standard === "Banned") return false;
  if (card.regulationMark) return isMarkLegal(card.regulationMark);
  // Basic Energy often ships without a regulation mark
  if (
    card.supertype === "Energy" &&
    (card.subtypes ?? []).includes("Basic") &&
    isSvEraSetId(setId)
  ) {
    return true;
  }
  return false;
}

type RemoteSet = {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  ptcgoCode?: string;
  images?: { symbol?: string; logo?: string };
};

type RemoteCard = {
  id: string;
  name: string;
  number: string;
  artist?: string;
  rarity?: string;
  regulationMark?: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  attacks?: {
    name: string;
    cost?: string[];
    damage?: string;
    text?: string;
  }[];
  abilities?: { name: string; type?: string; text?: string }[];
  weaknesses?: { type: string; value: string }[];
  resistances?: { type: string; value: string }[];
  retreatCost?: string[];
  rules?: string[];
  legalities?: { standard?: string; expanded?: string };
  images?: { small?: string; large?: string };
  set: { id: string; name: string; ptcgoCode?: string };
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  console.log("Fetching sets…");
  const sets = await fetchJson<RemoteSet[]>(`${RAW}/sets/en.json`);

  const candidateSets = sets.filter((s) => isSvEraSetId(s.id));
  console.log(`Candidate SV-era sets: ${candidateSets.length}`);

  const cardsOut: Record<string, unknown>[] = [];
  const setStats: {
    id: string;
    code: string;
    name: string;
    series: string;
    releaseDate: string;
    ptcgoCode?: string;
    symbol?: string;
    logo?: string;
    legalCardCount: number;
    marks: string[];
  }[] = [];

  // Prefer unique PTCGO codes; if collisions, keep both with id-based suffix only when needed
  const codeCounts = new Map<string, number>();

  for (const set of candidateSets) {
    const url = `${RAW}/cards/en/${set.id}.json`;
    process.stdout.write(`  ${set.id}… `);
    let remoteCards: RemoteCard[];
    try {
      remoteCards = await fetchJson<RemoteCard[]>(url);
    } catch (e) {
      console.log("skip", e instanceof Error ? e.message : e);
      continue;
    }

    const legal = remoteCards.filter((c) => isCardLegal(c, set.id));
    const marks = [
      ...new Set(
        legal
          .map((c) => c.regulationMark)
          .filter((m): m is string => !!m)
          .map((m) => m.toUpperCase()),
      ),
    ].sort();

    let code = (set.ptcgoCode || set.id).toUpperCase();
    const seen = codeCounts.get(code) ?? 0;
    codeCounts.set(code, seen + 1);
    if (seen > 0) {
      // Rare collision (trainer gallery / special subsets) — use API id
      code = set.id.toUpperCase();
    }

    console.log(`${legal.length}/${remoteCards.length} H+`);

    // Drop early-SV leftovers that only contribute 1–2 reprints
    const keepTiny =
      set.id === "sve" || set.id === "svp" || set.id.startsWith("me");
    if (legal.length === 0) continue;
    if (legal.length < 8 && !keepTiny) {
      console.log(`    (skip tiny set ${set.id})`);
      continue;
    }

    setStats.push({
      id: set.id,
      code,
      name: set.name,
      series: set.series,
      releaseDate: set.releaseDate,
      ptcgoCode: set.ptcgoCode,
      symbol: set.images?.symbol,
      logo: set.images?.logo,
      legalCardCount: legal.length,
      marks,
    });

    for (const c of legal) {
      const numBare = c.number.replace(/^0+/, "") || c.number;
      // Keep Lab ids as {ptcgo}-{printedNumber} so school/lists keep resolving
      const labId = `${code.toLowerCase()}-${c.number}`;
      cardsOut.push({
        id: labId,
        apiId: c.id,
        name: c.name,
        setCode: code,
        setId: set.id,
        setName: set.name,
        number: c.number,
        regulationMark: (c.regulationMark || "").toUpperCase(),
        supertype: c.supertype as "Pokémon" | "Trainer" | "Energy",
        subtypes: c.subtypes ?? [],
        hp: c.hp ? Number(c.hp) : undefined,
        types: c.types,
        evolvesFrom: c.evolvesFrom,
        attacks: c.attacks?.map((a) => ({
          name: a.name,
          cost: a.cost ?? [],
          damage: a.damage,
          text: a.text,
        })),
        abilities: c.abilities?.map((a) => ({
          name: a.name,
          type: a.type ?? "Ability",
          text: a.text ?? "",
        })),
        weaknesses: c.weaknesses,
        resistances: c.resistances,
        retreat: c.retreatCost?.length,
        rules: c.rules,
        rarity: c.rarity,
        artist: c.artist,
        imageSmall:
          c.images?.small ??
          `https://images.pokemontcg.io/${set.id}/${numBare}.png`,
        imageLarge:
          c.images?.large ??
          `https://images.pokemontcg.io/${set.id}/${numBare}_hires.png`,
        ptcgoCode: set.ptcgoCode ?? code,
        legalities: {
          standard: "Legal",
          expanded: c.legalities?.expanded,
        },
      });
    }
  }

  setStats.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

  writeFileSync(join(OUT, "sets.json"), JSON.stringify(setStats, null, 2));
  writeFileSync(join(OUT, "cards.json"), JSON.stringify(cardsOut));

  console.log(
    `\nWrote ${setStats.length} sets, ${cardsOut.length} cards → data/cards/`,
  );
  console.log(
    "Sets:",
    setStats.map((s) => `${s.code}:${s.legalCardCount}`).join(", "),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
