import { runConsistencyReport } from "../src/lib/analysis/consistency";
import { suggestSwaps } from "../src/lib/analysis/swaps";
import { runMatchupVsArchetype } from "../src/lib/analysis/matchup";
import { parseDeckList } from "../src/lib/lists/parse";
import { TOP8 } from "../src/lib/archetypes";
import { META_SNAPSHOT } from "../src/lib/meta/snapshot";

const a = TOP8.find((x) => x.id === "dragapult-ex")!;
const text = a.consensusList
  .map((e) =>
    e.setCode && e.number
      ? `${e.count} ${e.name} ${e.setCode} ${e.number}`
      : `${e.count} ${e.name}`,
  )
  .join("\n");
const { entries } = parseDeckList(text);
const c = runConsistencyReport(entries, { trials: 100, seed: 1 });
console.log("consistency", {
  mulligan: c.mulliganRate,
  t2: c.attackTurn2Rate,
  prizeLock: c.prizeLock,
});
const swaps = suggestSwaps(entries, META_SNAPSHOT.fieldShare, 1);
console.log("swaps", swaps.slice(0, 3));
const m = runMatchupVsArchetype(entries, "festival-lead", { games: 16, seed: 2 });
console.log("matchup", m.g1WinRate, m.bo3Estimate, m.caveat.slice(0, 40));
console.log("analysis tests ok");
