import type { DeckEntry, EnergyType, TcgCard } from "@/lib/types";
import { getCardById, isBasicPokemon } from "@/lib/cards";
import type { Action } from "./actions";
import {
  energyTypeFromCardName,
  getLegalActions,
  isBasicEnergyCard,
  parseDamageString,
  prizeValueForCard,
} from "./actions";
import { createRng, type Rng } from "./rng";
import {
  applyScriptedEffect,
  drawCards,
  type ScriptCtx,
} from "./scripts";
import type {
  CardRef,
  GameState,
  PlayerState,
  PokemonInPlay,
} from "./state";
import {
  cloneState,
  createEmptyPlayer,
  emptyConditions,
  isKnockedOut,
  occupiedBench,
  pushLog,
  serializeState,
  deserializeState,
} from "./state";

/** Minimal agent interface (defined here to avoid circular imports with agents.ts). */
export type AgentLike = {
  choose(state: GameState, playerIndex: number, legal: Action[]): Action;
};

export { serializeState, deserializeState, getLegalActions };

function nextId(state: GameState): string {
  state.nextInstanceId += 1;
  return `i${state.nextInstanceId}`;
}

function makeRef(state: GameState, cardId: string, name: string): CardRef {
  return { instanceId: nextId(state), cardId, name };
}

function makePokemon(state: GameState, card: TcgCard): PokemonInPlay {
  const hp = card.hp ?? 60;
  return {
    cardId: card.id,
    cardName: card.name,
    instanceId: nextId(state),
    hp,
    maxHp: hp,
    damage: 0,
    energy: [],
    conditions: emptyConditions(),
    abilityUsed: {},
  };
}

function buildDeck(state: GameState, entries: DeckEntry[], rng: Rng): CardRef[] {
  const cards: CardRef[] = [];
  for (const e of entries) {
    for (let i = 0; i < e.count; i++) {
      cards.push(makeRef(state, e.card.id, e.card.name));
    }
  }
  return rng.shuffle(cards);
}

function hasBasicInHand(player: PlayerState): boolean {
  return player.hand.some((c) => {
    const card = getCardById(c.cardId);
    return card ? isBasicPokemon(card) : false;
  });
}

function placePrizes(player: PlayerState, n = 6): void {
  player.prizes = [];
  for (let i = 0; i < n; i++) {
    const c = player.deck.shift();
    if (!c) break;
    player.prizes.push(c);
  }
  player.prizeCount = player.prizes.length;
}

function autoPlaceActive(player: PlayerState, state: GameState): boolean {
  const idx = player.hand.findIndex((c) => {
    const card = getCardById(c.cardId);
    return card ? isBasicPokemon(card) : false;
  });
  if (idx < 0) return false;
  const ref = player.hand.splice(idx, 1)[0]!;
  const card = getCardById(ref.cardId)!;
  player.active = makePokemon(state, card);
  // Keep instance aligned
  player.active.instanceId = ref.instanceId;
  return true;
}

function scriptCtx(state: GameState, rng: Rng): ScriptCtx {
  return {
    rng,
    makeRef: (cardId, name) => makeRef(state, cardId, name),
    makePokemon: (card) => makePokemon(state, card),
  };
}

function rngFromState(state: GameState): Rng {
  const seed = state.rngState ?? state.seed;
  const rng = createRng(seed);
  // advance once so sequential calls diverge slightly when seed reused
  return rng;
}

function commitRng(state: GameState, rng: Rng): void {
  // Derive next seed from a draw
  state.rngState = (Math.floor(rng.next() * 0xffffffff) ^ state.seed) >>> 0;
}

/**
 * Setup a game: shuffle, prizes 6, draw 7, mulligan until Basic, place active.
 */
export function setupGame(
  listA: DeckEntry[],
  listB: DeckEntry[],
  seed: number,
  firstPlayer: 0 | 1 = 0,
): GameState {
  const rng = createRng(seed);
  const state: GameState = {
    players: [createEmptyPlayer(), createEmptyPlayer()],
    turn: 0,
    activePlayer: firstPlayer,
    phase: "setup",
    seed,
    rngState: seed,
    log: [],
    stadium: null,
    firstPlayer,
    nextInstanceId: 0,
  };

  state.players[0]!.deck = buildDeck(state, listA, rng);
  state.players[1]!.deck = buildDeck(state, listB, rng);

  for (let pi = 0; pi < 2; pi++) {
    const player = state.players[pi as 0 | 1]!;
    // Mulligan loop
    for (let attempt = 0; attempt < 20; attempt++) {
      player.hand = [];
      drawCards(player, 7);
      if (hasBasicInHand(player)) break;
      player.mulligans += 1;
      player.deck = rng.shuffle([...player.deck, ...player.hand]);
      player.hand = [];
    }
    placePrizes(player, 6);
    autoPlaceActive(player, state);
    // Optional: put remaining basics on bench up to 5
    const basics = player.hand
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => {
        const card = getCardById(c.cardId);
        return card ? isBasicPokemon(card) : false;
      });
    let slot = 0;
    for (const { c, i } of basics) {
      while (slot < 5 && player.bench[slot]) slot++;
      if (slot >= 5) break;
      // remove from hand (adjust later indices carefully — collect ids)
      void i;
      const card = getCardById(c.cardId)!;
      player.bench[slot] = makePokemon(state, card);
      player.bench[slot]!.instanceId = c.instanceId;
      slot++;
    }
    player.hand = player.hand.filter(
      (h) => !player.bench.some((b) => b?.instanceId === h.instanceId) && h.instanceId !== player.active?.instanceId,
    );
  }

  // Extra draws for opponent mulligans (simplified: each mulligan → opp draws 1)
  if (state.players[0]!.mulligans > 0) {
    drawCards(state.players[1]!, state.players[0]!.mulligans);
  }
  if (state.players[1]!.mulligans > 0) {
    drawCards(state.players[0]!, state.players[1]!.mulligans);
  }

  state.phase = "player-turn";
  state.turn = 1;
  state.activePlayer = firstPlayer;
  // First player does not draw on turn 1
  pushLog(state, firstPlayer, "setup", `Game setup — P${firstPlayer + 1} goes first`);
  commitRng(state, rng);
  return state;
}

function clearTurnFlags(player: PlayerState): void {
  player.energyAttachedThisTurn = 0;
  player.supporterPlayedThisTurn = false;
  player.retreatUsed = false;
  for (const p of [player.active, ...player.bench]) {
    if (p) p.abilityUsed = {};
  }
  // clear item lock from Unfair Stamp at start of that player's turn
  delete player.abilityLocks["no-items"];
}

export function startTurn(state: GameState): GameState {
  const s = cloneState(state);
  const player = s.players[s.activePlayer]!;
  clearTurnFlags(player);
  // Draw (except very first turn of the game for first player — turn===1 && active===first)
  const isFirstTurnOfGame = s.turn === 1 && s.activePlayer === s.firstPlayer;
  if (!isFirstTurnOfGame) {
    drawCards(player, 1);
  }
  // Status: remove sleep/para at start simplified — flip sleep
  if (player.active?.conditions.asleep) {
    const rng = rngFromState(s);
    if (rng.chance(0.5)) player.active.conditions.asleep = false;
    commitRng(s, rng);
  }
  if (player.active?.conditions.paralyzed) {
    player.active.conditions.paralyzed = false;
  }
  s.phase = "player-turn";
  return s;
}

function promoteBenchIfNeeded(player: PlayerState): void {
  if (player.active) return;
  const bench = occupiedBench(player);
  if (bench.length === 0) return;
  player.active = bench[0]!.pokemon;
  player.bench[bench[0]!.index] = null;
}

function discardPokemon(player: PlayerState, mon: PokemonInPlay): void {
  player.discard.push({
    instanceId: mon.instanceId,
    cardId: mon.cardId,
    name: mon.cardName,
  });
  for (const e of mon.energy) {
    player.discard.push({
      instanceId: `${mon.instanceId}-e-${e}`,
      cardId: `energy-${e.toLowerCase()}`,
      name: `${e} Energy`,
    });
  }
  if (mon.tool) player.discard.push(mon.tool);
}

/**
 * Check KOs, award prizes to the opponent of the KO'd Pokémon.
 */
export function resolveKnockouts(state: GameState): GameState {
  const s = cloneState(state);
  for (let pi = 0; pi < 2; pi++) {
    const player = s.players[pi as 0 | 1]!;
    const opp = s.players[(1 - pi) as 0 | 1]!;

    // Bench KOs
    for (let i = 0; i < 5; i++) {
      const b = player.bench[i];
      if (b && isKnockedOut(b)) {
        const card = getCardById(b.cardId);
        const prizes = card ? prizeValueForCard(card) : 1;
        discardPokemon(player, b);
        player.bench[i] = null;
        takePrizes(opp, prizes, s, (1 - pi) as 0 | 1);
        pushLog(s, (1 - pi) as 0 | 1, "ko", `KO ${b.cardName} (bench)`);
      }
    }

    if (player.active && isKnockedOut(player.active)) {
      const card = getCardById(player.active.cardId);
      const prizes = card ? prizeValueForCard(card) : 1;
      discardPokemon(player, player.active);
      pushLog(s, (1 - pi) as 0 | 1, "ko", `KO ${player.active.cardName}`);
      player.active = null;
      takePrizes(opp, prizes, s, (1 - pi) as 0 | 1);
      promoteBenchIfNeeded(player);
    }
  }

  checkWinner(s);
  return s;
}

function takePrizes(player: PlayerState, n: number, state: GameState, pi: 0 | 1): void {
  for (let i = 0; i < n; i++) {
    if (player.prizes.length === 0) break;
    const prize = player.prizes.shift()!;
    player.hand.push(prize);
    player.prizeCount = player.prizes.length;
    pushLog(state, pi, "prize", `Took a Prize card (${prize.name})`);
  }
}

function checkWinner(state: GameState): void {
  for (let pi = 0; pi < 2; pi++) {
    if (state.players[pi as 0 | 1]!.prizeCount <= 0) {
      state.winner = pi as 0 | 1;
      state.phase = "game-over";
      pushLog(state, pi, "win", `Player ${pi + 1} took all prizes`);
      return;
    }
    if (
      !state.players[pi as 0 | 1]!.active &&
      occupiedBench(state.players[pi as 0 | 1]!).length === 0
    ) {
      state.winner = (1 - pi) as 0 | 1;
      state.phase = "game-over";
      pushLog(state, (1 - pi) as 0 | 1, "win", `Player ${pi + 1} has no Pokémon`);
      return;
    }
  }
}

export function endTurn(state: GameState): GameState {
  let s = resolveKnockouts(state);
  if (s.phase === "game-over") return s;

  // Poison / burn between turns (simplified)
  for (const p of s.players) {
    if (p.active?.conditions.poisoned) p.active.damage += 10;
    if (p.active?.conditions.burned) p.active.damage += 20;
  }
  s = resolveKnockouts(s);
  if (s.phase === "game-over") return s;

  s.activePlayer = (1 - s.activePlayer) as 0 | 1;
  if (s.activePlayer === s.firstPlayer) {
    s.turn += 1;
  }
  return startTurn(s);
}

export function stepTurn(state: GameState): GameState {
  return endTurn(state);
}

export function applyAction(state: GameState, action: Action): GameState {
  let s = cloneState(state);
  if (s.phase === "game-over") return s;

  const rng = rngFromState(s);
  const ctx = scriptCtx(s, rng);
  const pi = action.playerIndex;
  const player = s.players[pi]!;

  switch (action.type) {
    case "pass": {
      commitRng(s, rng);
      return endTurn(s);
    }
    case "concede": {
      s.winner = (1 - pi) as 0 | 1;
      s.phase = "game-over";
      pushLog(s, pi, "concede", `Player ${pi + 1} conceded`);
      return s;
    }
    case "playBasic": {
      const hi = action.handIndex ?? -1;
      const ref = player.hand[hi];
      if (!ref) break;
      const card = getCardById(ref.cardId);
      if (!card || !isBasicPokemon(card)) break;
      player.hand.splice(hi, 1);
      const mon = makePokemon(s, card);
      mon.instanceId = ref.instanceId;
      if (!player.active || action.benchIndex === -1) {
        if (!player.active) player.active = mon;
        else {
          const slots = player.bench.findIndex((b) => !b);
          if (slots >= 0) player.bench[slots] = mon;
        }
      } else if (action.benchIndex !== undefined && action.benchIndex >= 0) {
        player.bench[action.benchIndex] = mon;
      }
      pushLog(s, pi, "play", `Played Basic ${card.name}`);
      break;
    }
    case "evolve": {
      const hi = action.handIndex ?? -1;
      const ref = player.hand[hi];
      if (!ref || !action.evolveOntoInstanceId) break;
      const card = getCardById(ref.cardId);
      if (!card) break;
      const find = (id: string) => {
        if (player.active?.instanceId === id) return { where: "active" as const, idx: -1 };
        const bi = player.bench.findIndex((b) => b?.instanceId === id);
        if (bi >= 0) return { where: "bench" as const, idx: bi };
        return null;
      };
      const loc = find(action.evolveOntoInstanceId);
      if (!loc) break;
      const base =
        loc.where === "active" ? player.active! : player.bench[loc.idx]!;
      player.hand.splice(hi, 1);
      const evolved: PokemonInPlay = {
        ...base,
        cardId: card.id,
        cardName: card.name,
        maxHp: card.hp ?? base.maxHp,
        hp: card.hp ?? base.hp,
        evolvedFrom: base.cardName,
        abilityUsed: {},
      };
      player.discard.push({
        instanceId: base.instanceId + "-evo",
        cardId: base.cardId,
        name: base.cardName,
      });
      if (loc.where === "active") player.active = evolved;
      else player.bench[loc.idx] = evolved;
      pushLog(s, pi, "evolve", `Evolved into ${card.name}`);
      break;
    }
    case "attachEnergy": {
      const hi = action.handIndex ?? -1;
      const ref = player.hand[hi];
      if (!ref || player.energyAttachedThisTurn >= 1) break;
      const card = getCardById(ref.cardId);
      if (!card || !isBasicEnergyCard(card)) break;
      const et =
        energyTypeFromCardName(card.name) ?? (card.types?.[0] as EnergyType | undefined);
      if (!et) break;
      const target =
        action.targetIndex === undefined || action.targetIndex < 0
          ? player.active
          : player.bench[action.targetIndex];
      if (!target) break;
      player.hand.splice(hi, 1);
      target.energy.push(et);
      player.energyAttachedThisTurn += 1;
      pushLog(s, pi, "energy", `Attached ${card.name} to ${target.cardName}`);
      break;
    }
    case "playItem":
    case "playSupporter":
    case "playStadium": {
      if (player.abilityLocks["no-items"] && action.type === "playItem") break;
      const handled = applyScriptedEffect(s, action, ctx);
      if (!handled && action.type === "playStadium") {
        const hi = action.handIndex ?? -1;
        const ref = player.hand[hi];
        if (ref) {
          player.hand.splice(hi, 1);
          if (s.stadium) {
            const owner = s.players[0]!.stadiumOwner ? 0 : 1;
            s.players[owner]!.discard.push(s.stadium);
          }
          s.stadium = ref;
          player.stadiumOwner = true;
          s.players[(1 - pi) as 0 | 1]!.stadiumOwner = false;
          pushLog(s, pi, "stadium", `Played ${ref.name}`);
        }
      } else if (!handled) {
        // Unscripted: discard as no-op (should not appear in legal list)
        const hi = action.handIndex ?? -1;
        const ref = player.hand[hi];
        if (ref) {
          player.hand.splice(hi, 1);
          player.discard.push(ref);
          if (action.type === "playSupporter") player.supporterPlayedThisTurn = true;
          pushLog(s, pi, "unscripted", `Played unscripted ${ref.name}`);
        }
      }
      break;
    }
    case "playTool": {
      const hi = action.handIndex ?? -1;
      const ref = player.hand[hi];
      if (!ref || !player.active || player.active.tool) break;
      player.hand.splice(hi, 1);
      player.active.tool = ref;
      pushLog(s, pi, "tool", `Attached ${ref.name}`);
      break;
    }
    case "retreat": {
      if (!player.active || player.retreatUsed) break;
      const bi = action.benchIndex ?? -1;
      const incoming = player.bench[bi];
      if (!incoming) break;
      const card = getCardById(player.active.cardId);
      let cost = card?.retreat ?? 0;
      if (
        s.stadium?.name === "Festival Grounds" &&
        (card?.abilities ?? []).some((a) => a.name === "Festival Lead")
      ) {
        cost = 0;
      }
      for (let i = 0; i < cost; i++) {
        const e = player.active.energy.pop();
        if (e) {
          player.discard.push({
            instanceId: `${player.active.instanceId}-ret-${i}`,
            cardId: `energy-${e.toLowerCase()}`,
            name: `${e} Energy`,
          });
        }
      }
      player.bench[bi] = player.active;
      player.active = incoming;
      player.retreatUsed = true;
      pushLog(s, pi, "retreat", `Retreated to ${incoming.cardName}`);
      break;
    }
    case "ability": {
      applyScriptedEffect(s, action, ctx);
      break;
    }
    case "attack": {
      s.phase = "attack";
      applyScriptedEffect(s, action, ctx);
      // If script didn't handle, apply generic damage
      if (!s.log.some((l) => l.tag === "attack" && l.turn === s.turn)) {
        const atk = getCardById(player.active?.cardId ?? "")?.attacks?.[
          action.attackIndex ?? 0
        ];
        const dmg = parseDamageString(atk?.damage);
        const opp = s.players[(1 - pi) as 0 | 1]!;
        if (opp.active && dmg > 0) opp.active.damage += dmg;
        pushLog(s, pi, "attack", `${player.active?.cardName} used ${atk?.name ?? "attack"}`);
      }
      commitRng(s, rng);
      s = resolveKnockouts(s);
      if (s.phase === "game-over") return s;
      return endTurn(s);
    }
    case "takePrize": {
      const idx = action.targetIndex ?? 0;
      if (player.prizes[idx]) {
        const [prize] = player.prizes.splice(idx, 1);
        if (prize) {
          player.hand.push(prize);
          player.prizeCount = player.prizes.length;
          pushLog(s, pi, "prize", `Took Prize ${prize.name}`);
        }
      }
      checkWinner(s);
      break;
    }
    default:
      break;
  }

  commitRng(s, rng);
  s = resolveKnockouts(s);
  return s;
}

export type PlayGameResult = {
  winner: 0 | 1 | "draw" | undefined;
  turns: number;
  log: GameState["log"];
  summary: string;
};

export function playGame(
  listA: DeckEntry[],
  listB: DeckEntry[],
  seed: number,
  agentA: AgentLike,
  agentB: AgentLike,
  maxTurns = 100,
): PlayGameResult {
  let state = setupGame(listA, listB, seed);
  state = startTurn(state);

  let actionsThisTurn = 0;
  let guard = 0;
  const maxGuard = maxTurns * 40;

  while (state.phase !== "game-over" && state.turn <= maxTurns && guard < maxGuard) {
    guard++;
    const turnBefore = state.turn;
    const pi = state.activePlayer;
    const agent = pi === 0 ? agentA : agentB;
    let legal = getLegalActions(state, pi).filter((a) => a.type !== "concede");
    if (legal.length === 0) {
      state = endTurn(state);
      actionsThisTurn = 0;
      continue;
    }
    // After many actions without attacking, force pass to avoid softlocks
    if (actionsThisTurn >= 24) {
      legal = legal.filter((a) => a.type === "pass" || a.type === "attack");
      if (!legal.some((a) => a.type === "pass")) {
        legal = [{ type: "pass", playerIndex: pi, label: "Pass / End turn" }];
      }
    }
    const action = agent.choose(state, pi, legal);
    const beforeLog = state.log.length;
    state = applyAction(state, action);
    if (state.turn !== turnBefore || state.phase === "game-over") {
      actionsThisTurn = 0;
    } else {
      actionsThisTurn++;
      // No-op action (log unchanged): force end turn
      if (state.log.length === beforeLog && action.type !== "pass") {
        state = endTurn(state);
        actionsThisTurn = 0;
      }
    }
  }

  if (state.phase !== "game-over") {
    // Timeout: fewer prizes remaining wins
    const p0 = state.players[0]!.prizeCount;
    const p1 = state.players[1]!.prizeCount;
    if (p0 < p1) state.winner = 0;
    else if (p1 < p0) state.winner = 1;
    else state.winner = "draw";
    state.phase = "game-over";
  }

  const summary = `Winner=${state.winner} turns=${state.turn} log=${state.log.length}`;
  return {
    winner: state.winner,
    turns: state.turn,
    log: state.log,
    summary,
  };
}

/**
 * Hydrate a partial Board Lab sandbox into a playable GameState.
 */
export function fromPosition(partial: Partial<GameState> & {
  players?: [Partial<PlayerState>?, Partial<PlayerState>?];
}): GameState {
  const base: GameState = {
    players: [createEmptyPlayer(), createEmptyPlayer()],
    turn: partial.turn ?? 1,
    activePlayer: partial.activePlayer ?? 0,
    phase: partial.phase ?? "player-turn",
    seed: partial.seed ?? 1,
    rngState: partial.rngState ?? partial.seed ?? 1,
    log: partial.log ?? [],
    winner: partial.winner,
    stadium: partial.stadium ?? null,
    firstPlayer: partial.firstPlayer ?? 0,
    nextInstanceId: partial.nextInstanceId ?? 1000,
  };

  for (let i = 0; i < 2; i++) {
    const p = partial.players?.[i];
    if (!p) continue;
    base.players[i as 0 | 1] = {
      ...createEmptyPlayer(),
      ...p,
      bench: p.bench
        ? ([0, 1, 2, 3, 4].map((j) => p.bench?.[j] ?? null) as PlayerState["bench"])
        : createEmptyPlayer().bench,
      hand: p.hand ?? [],
      deck: p.deck ?? [],
      discard: p.discard ?? [],
      prizes: p.prizes ?? [],
      lostZone: p.lostZone ?? [],
      abilityLocks: p.abilityLocks ?? {},
      prizeCount: p.prizeCount ?? p.prizes?.length ?? 6,
    };
  }

  if (partial.stadium !== undefined) base.stadium = partial.stadium;
  return base;
}
