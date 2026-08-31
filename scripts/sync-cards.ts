/**
 * Sync Standard-legal cards from PokemonTCG/pokemon-tcg-data (optional enrichment).
 * For localhost we ship a curated catalog; this script can regenerate a JSON dump.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "data/cards");
mkdirSync(OUT, { recursive: true });

const SETS_URL =
  "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json";

async function main() {
  console.log("Fetching sets metadata…");
  const res = await fetch(SETS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const sets = (await res.json()) as Array<{
    id: string;
    name: string;
    series: string;
    releaseDate: string;
    ptcgoCode?: string;
    legalities?: { standard?: string };
  }>;
  const standardish = sets.filter(
    (s) =>
      s.legalities?.standard === "Legal" ||
      ["sv5", "sv6", "sv6pt5", "sv7", "sv8", "sv8pt5", "sv9", "sv10"].includes(
        s.id,
      ) ||
      s.id.startsWith("me"),
  );
  writeFileSync(
    join(OUT, "remote-sets.json"),
    JSON.stringify(standardish, null, 2),
  );
  console.log(
    `Wrote ${standardish.length} sets to data/cards/remote-sets.json`,
  );
  console.log(
    "Curated catalog in src/lib/cards/catalog.ts remains the runtime source of truth.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
