import type { CardRef, GameState, PlayerState } from "@/lib/engine/state";
import { createEmptyPlayer } from "@/lib/engine/state";
import { fromPosition } from "@/lib/engine/game";

export type ReplayEvent = {
  line: number;
  raw: string;
  type:
    | "setup"
    | "turn"
    | "play"
    | "attach"
    | "attack"
    | "damage"
    | "prize"
    | "ability"
    | "evolve"
    | "retreat"
    | "other";
  playerName?: string;
  cardName?: string;
  attackName?: string;
  energyType?: string;
  targetName?: string;
  amount?: number;
};

export type ReplayFrame = {
  index: number;
  turn: number;
  activePlayerName: string | null;
  eventsThrough: number;
  zones: [ZoneCounts, ZoneCounts];
  lastEvent?: ReplayEvent;
};

export type ZoneCounts = {
  hand: number;
  deck: number;
  discard: number;
  prizes: number;
  bench: number;
  active: boolean;
};

export type ParseReplayResult = {
  players: [string, string];
  events: ReplayEvent[];
  frames: ReplayFrame[];
  errors: string[];
};

const TURN_RE = /^(.+?)'s turn\.?$/i;
const PLAYED_RE = /^(.+?) played (.+)\.$/i;
const ATTACHED_RE = /^(.+?) attached an? (.+?) to (.+)\.$/i;
const USED_RE = /^(.+?) used (.+)\.$/i;
const PRIZE_RE = /^(.+?) took an? Prize card\.?$/i;
const DAMAGE_RE = /^-?\s*(\d+)\s+damage/i;
const EVOLVED_RE = /^(.+?) evolved (.+?) into (.+)\.$/i;

/**
 * Deterministic grammar parser for PTCGL English battle logs.
 */
export function parseReplay(text: string): ParseReplayResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  const events: ReplayEvent[] = [];
  const playerNames = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!.trim();
    if (!raw) continue;

    if (/^setup$/i.test(raw)) {
      events.push({ line: i + 1, raw, type: "setup" });
      continue;
    }

    let m: RegExpMatchArray | null;
    if ((m = raw.match(TURN_RE))) {
      playerNames.add(m[1]!);
      events.push({ line: i + 1, raw, type: "turn", playerName: m[1]! });
      continue;
    }
    if ((m = raw.match(PLAYED_RE))) {
      playerNames.add(m[1]!);
      events.push({
        line: i + 1,
        raw,
        type: "play",
        playerName: m[1]!,
        cardName: m[2]!.replace(/\.$/, ""),
      });
      continue;
    }
    if ((m = raw.match(ATTACHED_RE))) {
      playerNames.add(m[1]!);
      events.push({
        line: i + 1,
        raw,
        type: "attach",
        playerName: m[1]!,
        energyType: m[2]!.replace(/ Energy$/i, ""),
        targetName: m[3]!,
      });
      continue;
    }
    if ((m = raw.match(USED_RE))) {
      // "Dragapult ex used Phantom Dive." — Pokémon used attack (no player prefix sometimes)
      const subject = m[1]!;
      const what = m[2]!;
      if (playerNames.has(subject) || /played|attached/i.test(raw)) {
        events.push({
          line: i + 1,
          raw,
          type: "ability",
          playerName: subject,
          cardName: what,
        });
      } else {
        events.push({
          line: i + 1,
          raw,
          type: "attack",
          cardName: subject,
          attackName: what,
        });
      }
      continue;
    }
    if ((m = raw.match(PRIZE_RE))) {
      playerNames.add(m[1]!);
      events.push({ line: i + 1, raw, type: "prize", playerName: m[1]! });
      continue;
    }
    if ((m = raw.match(DAMAGE_RE))) {
      events.push({
        line: i + 1,
        raw,
        type: "damage",
        amount: Number(m[1]),
      });
      continue;
    }
    if ((m = raw.match(EVOLVED_RE))) {
      playerNames.add(m[1]!);
      events.push({
        line: i + 1,
        raw,
        type: "evolve",
        playerName: m[1]!,
        targetName: m[2]!,
        cardName: m[3]!,
      });
      continue;
    }

    events.push({ line: i + 1, raw, type: "other" });
  }

  const names = [...playerNames];
  const players: [string, string] = [names[0] ?? "Player 1", names[1] ?? "Player 2"];

  // Reconstruct zone counts heuristically
  const zones: [ZoneCounts, ZoneCounts] = [
    { hand: 7, deck: 47, discard: 0, prizes: 6, bench: 0, active: true },
    { hand: 7, deck: 47, discard: 0, prizes: 6, bench: 0, active: true },
  ];

  const frames: ReplayFrame[] = [];
  let turn = 0;
  let activePlayerName: string | null = null;

  frames.push({
    index: 0,
    turn: 0,
    activePlayerName: null,
    eventsThrough: 0,
    zones: structuredClone(zones),
  });

  for (let ei = 0; ei < events.length; ei++) {
    const e = events[ei]!;
    const pi = e.playerName === players[1] ? 1 : 0;
    const z = zones[pi as 0 | 1]!;
    const opp = zones[(1 - pi) as 0 | 1]!;

    switch (e.type) {
      case "turn":
        turn += 1;
        activePlayerName = e.playerName ?? null;
        // draw
        if (z.deck > 0) {
          z.deck -= 1;
          z.hand += 1;
        }
        break;
      case "play":
        if (z.hand > 0) z.hand -= 1;
        z.discard += 1;
        break;
      case "attach":
        if (z.hand > 0) z.hand -= 1;
        break;
      case "prize":
        if (z.prizes > 0) {
          z.prizes -= 1;
          z.hand += 1;
        }
        break;
      case "damage":
        void opp;
        break;
      default:
        break;
    }

    frames.push({
      index: frames.length,
      turn,
      activePlayerName,
      eventsThrough: ei + 1,
      zones: [
        { ...zones[0]! },
        { ...zones[1]! },
      ],
      lastEvent: e,
    });
  }

  if (names.length < 2) {
    errors.push("Could not identify two player names; used placeholders.");
  }

  return { players, events, frames, errors };
}

/**
 * Convert a replay frame into a partial GameState for Board Lab.
 */
export function forkFrame(frame: ReplayFrame): GameState {
  const mkPlayer = (z: ZoneCounts): PlayerState => {
    const p = createEmptyPlayer();
    p.hand = stubCards(z.hand, "Hand");
    p.deck = stubCards(z.deck, "Deck");
    p.discard = stubCards(z.discard, "Discard");
    p.prizes = stubCards(z.prizes, "Prize");
    p.prizeCount = z.prizes;
    if (z.active) {
      p.active = {
        cardId: "stub-active",
        cardName: "Active Pokémon",
        instanceId: `active-${Math.random().toString(36).slice(2, 7)}`,
        hp: 200,
        maxHp: 200,
        damage: 0,
        energy: [],
        conditions: {
          asleep: false,
          confused: false,
          paralyzed: false,
          poisoned: false,
          burned: false,
        },
      };
    }
    for (let i = 0; i < Math.min(5, z.bench); i++) {
      p.bench[i] = {
        cardId: `stub-bench-${i}`,
        cardName: `Bench ${i + 1}`,
        instanceId: `bench-${i}`,
        hp: 100,
        maxHp: 100,
        damage: 0,
        energy: [],
        conditions: {
          asleep: false,
          confused: false,
          paralyzed: false,
          poisoned: false,
          burned: false,
        },
      };
    }
    return p;
  };

  return fromPosition({
    turn: Math.max(1, frame.turn),
    activePlayer: frame.activePlayerName ? 0 : 0,
    phase: "player-turn",
    seed: frame.index + 1,
    players: [mkPlayer(frame.zones[0]!), mkPlayer(frame.zones[1]!)],
    log: frame.lastEvent
      ? [
          {
            turn: frame.turn,
            playerIndex: 0,
            tag: frame.lastEvent.type,
            message: frame.lastEvent.raw,
          },
        ]
      : [],
  });
}

function stubCards(n: number, label: string): CardRef[] {
  const out: CardRef[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      instanceId: `${label}-${i}`,
      cardId: "stub",
      name: `${label} Card`,
    });
  }
  return out;
}
