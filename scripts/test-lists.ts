import { parseDeckList, validateDeck } from "../src/lib/lists/parse";
import { exportToLimitlessText, exportToPtcglText } from "../src/lib/lists/export";
import { TOP8 } from "../src/lib/archetypes";

const a = TOP8[0]!;
const text = a.consensusList
  .map((e) =>
    e.setCode && e.number
      ? `${e.count} ${e.name} ${e.setCode} ${e.number}`
      : `${e.count} ${e.name}`,
  )
  .join("\n");
const parsed = parseDeckList(text);
const v = validateDeck(parsed.entries);
console.log("parsed stacks", parsed.entries.length, "total", v.total, "errors", v.errors);
console.log(exportToLimitlessText(parsed.entries).slice(0, 200));
console.log("---");
console.log(exportToPtcglText(parsed.entries).slice(0, 200));
console.log("list tests ok");
