import { parseReplay } from "../src/lib/replay/parse";
import { getSampleReplayText } from "../src/lib/replay/sample";

const r = parseReplay(getSampleReplayText());
console.log("players", r.players);
console.log("events", r.events.length, "frames", r.frames.length, "errors", r.errors);
if (r.events.length < 5) process.exit(1);
console.log("replay tests ok");
