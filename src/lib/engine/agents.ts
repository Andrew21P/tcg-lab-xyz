import type { PlaybookStyle } from "../../../data/archetypes/top8";
import { getArchetypeById } from "../../../data/archetypes/top8";
import type { Action } from "./actions";
import { createRng } from "./rng";
import type { GameState } from "./state";
import { allInPlay, occupiedBench, remainingHp } from "./state";

export type Agent = {
  name: string;
  choose(state: GameState, playerIndex: number, legal: Action[]): Action;
};

function pickRandom(legal: Action[], seed: number): Action {
  const rng = createRng(seed);
  return legal[rng.nextInt(legal.length)]!;
}

export const randomAgent: Agent = {
  name: "random",
  choose(state, playerIndex, legal) {
    if (legal.length === 0) {
      return { type: "pass", playerIndex: playerIndex as 0 | 1 };
    }
    // Prefer not conceding
    const nonConcede = legal.filter((a) => a.type !== "concede");
    const pool = nonConcede.length ? nonConcede : legal;
    return pickRandom(pool, state.rngState ?? state.seed + state.turn + playerIndex);
  },
};

function scoreAction(state: GameState, playerIndex: number, a: Action): number {
  const player = state.players[playerIndex as 0 | 1]!;
  const opp = state.players[(1 - playerIndex) as 0 | 1]!;
  let score = 0;

  switch (a.type) {
    case "concede":
      return -1000;
    case "pass":
      return -1;
    case "playBasic":
      score += player.active ? 5 : 40;
      break;
    case "evolve":
      score += 25;
      if (a.cardName?.includes("ex") || a.cardName?.startsWith("Mega")) score += 15;
      break;
    case "attachEnergy":
      score += 20;
      if (a.targetIndex === -1 || a.targetIndex === undefined) score += 5;
      break;
    case "playItem":
    case "playSupporter":
      if (a.cardName === "Rare Candy") score += 35;
      if (a.cardName === "Buddy-Buddy Poffin" || a.cardName === "Nest Ball") score += 22;
      if (a.cardName === "Ultra Ball") score += 18;
      if (a.cardName === "Boss's Orders") {
        score += 15;
        // Prefer Boss when can take 2 prizes (opp active low HP or ex)
        if (opp.active && remainingHp(opp.active) <= 200) score += 25;
        if (player.prizeCount <= 2) score += 20;
      }
      if (a.cardName === "Counter Catcher") score += 20;
      if (a.cardName === "Iono") score += player.hand.length <= 3 ? 20 : 8;
      if (a.cardName === "Professor's Research") score += 12;
      if (a.cardName === "Crispin") score += 16;
      if (a.cardName === "Night Stretcher") score += 10;
      break;
    case "playStadium":
      if (a.cardName === "Festival Grounds") score += 30;
      else score += 8;
      break;
    case "ability":
      if (a.abilityName === "Recon Directive") score += 14;
      if (a.abilityName === "Boom Boom Groove") score += 28;
      if (a.abilityName === "Adrena-Brain") score += 18;
      if (a.abilityName === "Cursed Blast") score += 22;
      break;
    case "attack": {
      score += 30;
      const atkName = a.label ?? "";
      if (atkName.includes("Phantom Dive")) score += 40;
      if (opp.active && remainingHp(opp.active) <= 220) score += 35; // KO threat
      break;
    }
    case "retreat":
      score += 5;
      if (player.active && remainingHp(player.active) <= 50) score += 15;
      break;
    default:
      score += 1;
  }

  // Festival loop bonus when Thwackey in play
  if (allInPlay(player).some((p) => p.cardName === "Thwackey")) {
    if (a.cardName === "Festival Grounds" || a.abilityName === "Boom Boom Groove") {
      score += 20;
    }
  }

  return score;
}

export const heuristicAgent: Agent = {
  name: "heuristic",
  choose(state, playerIndex, legal) {
    if (legal.length === 0) {
      return { type: "pass", playerIndex: playerIndex as 0 | 1 };
    }
    let best = legal[0]!;
    let bestScore = -Infinity;
    for (const a of legal) {
      const s = scoreAction(state, playerIndex, a);
      if (s > bestScore) {
        bestScore = s;
        best = a;
      }
    }
    return best;
  },
};

const PLAYBOOK_BIAS: Record<PlaybookStyle, (a: Action, state: GameState, pi: number) => number> = {
  "spread-then-snipe": (a) => {
    let b = 0;
    if (a.label?.includes("Phantom Dive")) b += 20;
    if (a.cardName === "Boss's Orders" || a.cardName === "Counter Catcher") b += 15;
    if (a.cardName === "Rare Candy") b += 12;
    return b;
  },
  "festival-loop": (a, state, pi) => {
    let b = 0;
    if (a.cardName === "Festival Grounds" || a.abilityName === "Boom Boom Groove") b += 25;
    if (a.cardName === "Buddy-Buddy Poffin") b += 10;
    if (allInPlay(state.players[pi as 0 | 1]!).some((p) => p.cardName === "Thwackey")) {
      b += 5;
    }
    return b;
  },
  tank: (a) => {
    let b = 0;
    if (a.type === "attachEnergy") b += 10;
    if (a.type === "evolve") b += 12;
    if (a.type === "attack") b += 8;
    return b;
  },
  disruption: (a) => {
    let b = 0;
    if (a.cardName === "Iono" || a.cardName === "Unfair Stamp") b += 18;
    if (a.cardName === "Boss's Orders") b += 10;
    return b;
  },
  box: (a) => {
    let b = 0;
    if (a.cardName === "Nest Ball" || a.cardName === "Buddy-Buddy Poffin") b += 12;
    if (a.cardName === "Ultra Ball") b += 8;
    return b;
  },
  "mega-attacker": (a) => {
    let b = 0;
    if (a.cardName === "Rare Candy") b += 20;
    if (a.type === "evolve") b += 15;
    if (a.type === "attack") b += 10;
    return b;
  },
};

export function playbookAgent(archetypeId: string): Agent {
  const arch = getArchetypeById(archetypeId);
  const style: PlaybookStyle = arch?.playbook ?? "spread-then-snipe";
  const bias = PLAYBOOK_BIAS[style];

  return {
    name: `playbook:${archetypeId}`,
    choose(state, playerIndex, legal) {
      if (legal.length === 0) {
        return { type: "pass", playerIndex: playerIndex as 0 | 1 };
      }
      let best = legal[0]!;
      let bestScore = -Infinity;
      for (const a of legal) {
        const s = scoreAction(state, playerIndex, a) + bias(a, state, playerIndex);
        if (s > bestScore) {
          bestScore = s;
          best = a;
        }
      }
      return best;
    },
  };
}

/** Prefer attacking for KO when available. */
export function preferKoAction(state: GameState, playerIndex: number, legal: Action[]): Action | null {
  const opp = state.players[(1 - playerIndex) as 0 | 1]!;
  if (!opp.active) return null;
  const attacks = legal.filter((a) => a.type === "attack");
  if (attacks.length && remainingHp(opp.active) <= 200) {
    return attacks.find((a) => a.label?.includes("Phantom Dive")) ?? attacks[0]!;
  }
  void occupiedBench;
  return null;
}
