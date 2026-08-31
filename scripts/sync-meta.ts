/** Placeholder meta sync — localhost uses vendored snapshot. */
import { META_SNAPSHOT } from "../src/lib/meta/snapshot";

console.log(
  `Vendored meta snapshot date: ${META_SNAPSHOT.date}\nSource: ${META_SNAPSHOT.sourceNote}\nArchetypes: ${Object.keys(META_SNAPSHOT.fieldShare).length}`,
);
console.log(
  "To refresh: update data/meta/snapshot-*.ts from Limitless (cite as data of record). Do not scrape Regionals HTML.",
);
