import { readFileSync, writeFileSync } from "fs";
import { LESSONS } from "../data/school/lessons";
import { getCardById, getCardsByName } from "../src/lib/cards";

const path = "data/school/lessons.ts";
let src = readFileSync(path, "utf8");

src = src.replace(
  /\{ instanceId: "([^"]+)", cardId: "([^"]+)", name: "([^"]+)" \}/g,
  (_m, instanceId: string, _cardId: string, name: string) => {
    const exact = getCardsByName(name).filter((c) => c.name === name);
    const hit = exact.find((c) => c.scripted) ?? exact[0];
    if (!hit) {
      console.warn("UNRESOLVED", name);
      return `{ instanceId: "${instanceId}", cardId: "${_cardId}", name: "${name}" }`;
    }
    console.log(`${name}: ${_cardId} → ${hit.id}`);
    return `{ instanceId: "${instanceId}", cardId: "${hit.id}", name: "${name}" }`;
  },
);

writeFileSync(path, src);

// verify
let bad = 0;
// re-import after write is hard; check via regex + getCardById on new ids
const re =
  /\{ instanceId: "([^"]+)", cardId: "([^"]+)", name: "([^"]+)" \}/g;
let m: RegExpExecArray | null;
while ((m = re.exec(src))) {
  const card = getCardById(m[2]!);
  if (!card || card.name !== m[3]) {
    console.log("BAD", m[2], m[3], "→", card?.name);
    bad++;
  }
}
console.log(bad === 0 ? "all lesson ids ok" : `bad=${bad}`);
