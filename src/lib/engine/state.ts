import type { EnergyType } from "@/lib/types";

export type CardRef = {
  instanceId: string;
  cardId: string;
  name: string;
  faceUp?: boolean;
};

export type SpecialConditions = {
  asleep: boolean;
  confused: boolean;
  paralyzed: boolean;
  poisoned: boolean;
  burned: boolean;
};

export type PokemonInPlay = {
  cardId: string;
  cardName: string;
  instanceId: string;
  hp: number;
  maxHp: number;
  damage: number;
  energy: EnergyType[];
  tool?: CardRef;
  conditions: SpecialConditions;
  evolvedFrom?: string;
  /** Ability once-per-turn locks keyed by ability name */
  abilityUsed?: Record<string, boolean>;
};

export type PlayerState = {
  active: PokemonInPlay | null;
  /** Fixed 5 bench slots; null = empty */
  bench: (PokemonInPlay | null)[];
  hand: CardRef[];
  deck: CardRef[];
  discard: CardRef[];
  prizes: CardRef[];
  lostZone: CardRef[];
  /** True if this player owns the current stadium */
  stadiumOwner: boolean;
  energyAttachedThisTurn: number;
  supporterPlayedThisTurn: boolean;
  retreatUsed: boolean;
  abilityLocks: Record<string, boolean>;
  /** Prizes remaining (usually prizes.length) */
  prizeCount: number;
  mulligans: number;
};

export type GamePhase =
  | "setup"
  | "player-turn"
  | "attack"
  | "between"
  | "game-over";

export type LogEntry = {
  turn: number;
  playerIndex: number;
  tag: string;
  message: string;
};

export type GameState = {
  players: [PlayerState, PlayerState];
  turn: number;
  activePlayer: 0 | 1;
  phase: GamePhase;
  seed: number;
  rngState?: number;
  log: LogEntry[];
  winner?: 0 | 1 | "draw";
  stadium?: CardRef | null;
  firstPlayer: 0 | 1;
  /** Shared instance id counter */
  nextInstanceId: number;
};

export function emptyConditions(): SpecialConditions {
  return {
    asleep: false,
    confused: false,
    paralyzed: false,
    poisoned: false,
    burned: false,
  };
}

export function createEmptyPlayer(): PlayerState {
  return {
    active: null,
    bench: [null, null, null, null, null],
    hand: [],
    deck: [],
    discard: [],
    prizes: [],
    lostZone: [],
    stadiumOwner: false,
    energyAttachedThisTurn: 0,
    supporterPlayedThisTurn: false,
    retreatUsed: false,
    abilityLocks: {},
    prizeCount: 6,
    mulligans: 0,
  };
}

export function clonePokemon(p: PokemonInPlay): PokemonInPlay {
  return {
    ...p,
    energy: [...p.energy],
    tool: p.tool ? { ...p.tool } : undefined,
    conditions: { ...p.conditions },
    abilityUsed: p.abilityUsed ? { ...p.abilityUsed } : undefined,
  };
}

export function clonePlayer(p: PlayerState): PlayerState {
  return {
    ...p,
    active: p.active ? clonePokemon(p.active) : null,
    bench: p.bench.map((b) => (b ? clonePokemon(b) : null)),
    hand: p.hand.map((c) => ({ ...c })),
    deck: p.deck.map((c) => ({ ...c })),
    discard: p.discard.map((c) => ({ ...c })),
    prizes: p.prizes.map((c) => ({ ...c })),
    lostZone: p.lostZone.map((c) => ({ ...c })),
    abilityLocks: { ...p.abilityLocks },
  };
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: [clonePlayer(state.players[0]), clonePlayer(state.players[1])],
    log: state.log.map((e) => ({ ...e })),
    stadium: state.stadium ? { ...state.stadium } : state.stadium,
  };
}

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeState(json: string): GameState {
  return JSON.parse(json) as GameState;
}

/** Prizes taken = starting 6 − remaining (clamped). */
export function countPrizesTaken(player: PlayerState, starting = 6): number {
  return Math.max(0, starting - player.prizeCount);
}

export function allInPlay(player: PlayerState): PokemonInPlay[] {
  const out: PokemonInPlay[] = [];
  if (player.active) out.push(player.active);
  for (const b of player.bench) {
    if (b) out.push(b);
  }
  return out;
}

export function emptyBenchSlots(player: PlayerState): number[] {
  const slots: number[] = [];
  for (let i = 0; i < 5; i++) {
    if (!player.bench[i]) slots.push(i);
  }
  return slots;
}

export function occupiedBench(player: PlayerState): { index: number; pokemon: PokemonInPlay }[] {
  const out: { index: number; pokemon: PokemonInPlay }[] = [];
  for (let i = 0; i < 5; i++) {
    const p = player.bench[i];
    if (p) out.push({ index: i, pokemon: p });
  }
  return out;
}

export function remainingHp(p: PokemonInPlay): number {
  return Math.max(0, p.maxHp - p.damage);
}

export function isKnockedOut(p: PokemonInPlay): boolean {
  return remainingHp(p) <= 0;
}

export function pushLog(
  state: GameState,
  playerIndex: number,
  tag: string,
  message: string,
): void {
  state.log.push({
    turn: state.turn,
    playerIndex,
    tag,
    message,
  });
}
