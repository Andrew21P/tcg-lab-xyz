import type { TcgCard } from "@/lib/types";
import { getCardById, getCardsByName, isBasicPokemon, isBasicEnergy } from "@/lib/cards";
import type { Action } from "./actions";
import type { Rng } from "./rng";
import type { CardRef, GameState, PokemonInPlay, PlayerState } from "./state";
import {
  emptyBenchSlots,
  occupiedBench,
  pushLog,
} from "./state";

function energyTypeFromCardName(name: string): import("@/lib/types").EnergyType | null {
  const types = [
    "Grass",
    "Fire",
    "Water",
    "Lightning",
    "Psychic",
    "Fighting",
    "Darkness",
    "Metal",
    "Dragon",
    "Fairy",
    "Colorless",
  ] as const;
  for (const t of types) {
    if (name === `${t} Energy`) return t;
  }
  return null;
}

function isBasicEnergyCard(card: TcgCard): boolean {
  return card.supertype === "Energy" && card.subtypes.includes("Basic");
}

/** Trainers the engine generates legal actions for. */
export const SCRIPTED_TRAINERS = new Set([
  "Ultra Ball",
  "Nest Ball",
  "Buddy-Buddy Poffin",
  "Rare Candy",
  "Boss's Orders",
  "Counter Catcher",
  "Iono",
  "Professor's Research",
  "Night Stretcher",
  "Crushing Hammer",
  "Crispin",
  "Arven",
  "Earthen Vessel",
  "Switch",
  "Super Rod",
  "Pokégear 3.0",
  "Poké Ball",
  "Energy Switch",
  "Festival Grounds",
  "Unfair Stamp",
  "Secret Box",
  "Lacey",
]);

const SCRIPTED_ATTACKS = new Set(["Phantom Dive", "Jet Headbutt", "Cruel Arrow"]);
const SCRIPTED_ABILITIES = new Set([
  "Recon Directive",
  "Boom Boom Groove",
  "Adrena-Brain",
  "Cursed Blast",
  "Festival Lead",
]);

export function isScripted(cardName: string): boolean {
  if (SCRIPTED_TRAINERS.has(cardName)) return true;
  const cards = getCardsByName(cardName);
  if (cards.some((c) => c.scripted)) return true;
  if (cards.some((c) => (c.attacks ?? []).some((a) => SCRIPTED_ATTACKS.has(a.name)))) return true;
  if (cards.some((c) => (c.abilities ?? []).some((a) => SCRIPTED_ABILITIES.has(a.name)))) {
    return true;
  }
  return false;
}

export type ScriptCtx = {
  rng: Rng;
  makeRef: (cardId: string, name: string) => CardRef;
  makePokemon: (card: TcgCard) => PokemonInPlay;
};

export function drawCards(player: PlayerState, n: number): CardRef[] {
  const drawn: CardRef[] = [];
  for (let i = 0; i < n; i++) {
    const c = player.deck.shift();
    if (!c) break;
    player.hand.push(c);
    drawn.push(c);
  }
  return drawn;
}

export function shuffleHandIntoDeck(player: PlayerState, rng: Rng): void {
  player.deck = rng.shuffle([...player.deck, ...player.hand]);
  player.hand = [];
}

function removeHandIndex(player: PlayerState, index: number): CardRef | undefined {
  if (index < 0 || index >= player.hand.length) return undefined;
  return player.hand.splice(index, 1)[0];
}

function discardFromHand(player: PlayerState, indices: number[]): CardRef[] {
  const sorted = [...indices].sort((a, b) => b - a);
  const out: CardRef[] = [];
  for (const i of sorted) {
    const c = removeHandIndex(player, i);
    if (c) {
      player.discard.push(c);
      out.push(c);
    }
  }
  return out;
}

function findInDeck(
  player: PlayerState,
  pred: (c: CardRef) => boolean,
): { index: number; card: CardRef } | null {
  const index = player.deck.findIndex(pred);
  if (index < 0) return null;
  return { index, card: player.deck[index]! };
}

function takeFromDeck(player: PlayerState, index: number): CardRef {
  return player.deck.splice(index, 1)[0]!;
}

function putStadiumInPlay(state: GameState, pi: 0 | 1, stadium: CardRef): void {
  if (state.stadium) {
    const owner = state.players[0]!.stadiumOwner ? 0 : 1;
    state.players[owner as 0 | 1]!.discard.push(state.stadium);
    state.players[0]!.stadiumOwner = false;
    state.players[1]!.stadiumOwner = false;
  }
  state.stadium = stadium;
  state.players[pi]!.stadiumOwner = true;
  state.players[(1 - pi) as 0 | 1]!.stadiumOwner = false;
}

function gustBenchToActive(opp: PlayerState, benchIndex: number): void {
  const incoming = opp.bench[benchIndex];
  if (!incoming) return;
  const old = opp.active;
  opp.bench[benchIndex] = old;
  opp.active = incoming;
}

function pokemonByInstance(player: PlayerState, instanceId: string): PokemonInPlay | null {
  if (player.active?.instanceId === instanceId) return player.active;
  for (const b of player.bench) {
    if (b?.instanceId === instanceId) return b;
  }
  return null;
}

function replacePokemon(
  player: PlayerState,
  instanceId: string,
  next: PokemonInPlay,
): void {
  if (player.active?.instanceId === instanceId) {
    player.active = next;
    return;
  }
  for (let i = 0; i < 5; i++) {
    if (player.bench[i]?.instanceId === instanceId) {
      player.bench[i] = next;
      return;
    }
  }
}

/** Apply a scripted trainer / ability / attack side-effect. Returns whether handled. */
export function applyScriptedEffect(
  state: GameState,
  action: Action,
  ctx: ScriptCtx,
): boolean {
  const pi = action.playerIndex;
  const player = state.players[pi]!;
  const opp = state.players[(1 - pi) as 0 | 1]!;
  const name = action.cardName ?? action.abilityName ?? "";

  if (action.type === "playItem" || action.type === "playSupporter") {
    return applyTrainer(state, action, ctx, name);
  }
  if (action.type === "playStadium" && name === "Festival Grounds") {
    const ref = removeHandIndex(player, action.handIndex ?? -1);
    if (!ref) return false;
    putStadiumInPlay(state, pi, ref);
    pushLog(state, pi, "stadium", `Played ${name}`);
    return true;
  }
  if (action.type === "ability") {
    return applyAbility(state, action, ctx);
  }
  if (action.type === "attack") {
    return applyAttackEffect(state, action, ctx);
  }
  return false;
}

function applyTrainer(
  state: GameState,
  action: Action,
  ctx: ScriptCtx,
  name: string,
): boolean {
  const pi = action.playerIndex;
  const player = state.players[pi]!;
  const opp = state.players[(1 - pi) as 0 | 1]!;
  const hi = action.handIndex ?? -1;

  switch (name) {
    case "Ultra Ball": {
      const discards = action.discardHandIndices ?? [];
      // discard 2 first (indices may shift relative to Ultra Ball)
      const ballRef = player.hand[hi];
      if (!ballRef) return false;
      discardFromHand(player, discards);
      // find ball again
      const ballIdx = player.hand.findIndex((c) => c.instanceId === ballRef.instanceId);
      const ball = removeHandIndex(player, ballIdx >= 0 ? ballIdx : hi);
      if (ball) player.discard.push(ball);
      const hit = findInDeck(player, (c) => getCardById(c.cardId)?.supertype === "Pokémon");
      if (hit) {
        const taken = takeFromDeck(player, hit.index);
        player.hand.push(taken);
        player.deck = ctx.rng.shuffle(player.deck);
        pushLog(state, pi, "search", `Ultra Ball → ${taken.name}`);
      } else {
        player.deck = ctx.rng.shuffle(player.deck);
        pushLog(state, pi, "search", "Ultra Ball missed");
      }
      return true;
    }
    case "Nest Ball": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      const slots = emptyBenchSlots(player);
      if (slots.length === 0) return true;
      const hit = findInDeck(player, (c) => {
        const card = getCardById(c.cardId);
        return !!card && isBasicPokemon(card);
      });
      if (hit) {
        const taken = takeFromDeck(player, hit.index);
        const card = getCardById(taken.cardId)!;
        player.bench[slots[0]!] = ctx.makePokemon(card);
        player.deck = ctx.rng.shuffle(player.deck);
        pushLog(state, pi, "search", `Nest Ball → ${taken.name}`);
      } else {
        player.deck = ctx.rng.shuffle(player.deck);
      }
      return true;
    }
    case "Buddy-Buddy Poffin": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      let placed = 0;
      for (let n = 0; n < 2; n++) {
        const slots = emptyBenchSlots(player);
        if (slots.length === 0) break;
        const hit = findInDeck(player, (c) => {
          const card = getCardById(c.cardId);
          return !!card && isBasicPokemon(card) && (card.hp ?? 99) <= 70;
        });
        if (!hit) break;
        const taken = takeFromDeck(player, hit.index);
        const card = getCardById(taken.cardId)!;
        player.bench[slots[0]!] = ctx.makePokemon(card);
        placed++;
      }
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "search", `Buddy-Buddy Poffin placed ${placed}`);
      return true;
    }
    case "Rare Candy": {
      const candy = removeHandIndex(player, hi);
      if (!candy) return false;
      player.discard.push(candy);
      const s2i = action.discardHandIndices?.[0];
      if (s2i === undefined) return true;
      // After removing candy, Stage 2 index may have shifted
      let s2ref: CardRef | undefined;
      if (s2i > hi) {
        s2ref = removeHandIndex(player, s2i - 1);
      } else {
        s2ref = removeHandIndex(player, s2i);
      }
      if (!s2ref) return true;
      const s2 = getCardById(s2ref.cardId);
      const targetId = action.evolveOntoInstanceId;
      if (!s2 || !targetId) {
        player.hand.push(s2ref);
        return true;
      }
      const base = pokemonByInstance(player, targetId);
      if (!base) {
        player.hand.push(s2ref);
        return true;
      }
      const evolved: PokemonInPlay = {
        ...base,
        cardId: s2.id,
        cardName: s2.name,
        maxHp: s2.hp ?? base.maxHp,
        hp: s2.hp ?? base.hp,
        evolvedFrom: base.cardName,
        abilityUsed: {},
      };
      // Keep damage; discard the Basic underneath conceptually into evolvedFrom chain
      player.discard.push({
        instanceId: base.instanceId + "-prev",
        cardId: base.cardId,
        name: base.cardName,
      });
      replacePokemon(player, targetId, evolved);
      pushLog(state, pi, "evolve", `Rare Candy → ${s2.name}`);
      return true;
    }
    case "Boss's Orders": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      player.supporterPlayedThisTurn = true;
      const bench = occupiedBench(opp);
      if (bench.length === 0) return true;
      const idx =
        action.oppTargetIndex !== undefined && opp.bench[action.oppTargetIndex]
          ? action.oppTargetIndex
          : bench[0]!.index;
      gustBenchToActive(opp, idx);
      pushLog(state, pi, "gust", `Boss's Orders → ${opp.active?.cardName}`);
      return true;
    }
    case "Counter Catcher": {
      if (player.prizeCount <= opp.prizeCount) return false;
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      const bench = occupiedBench(opp);
      if (bench.length === 0) return true;
      const idx =
        action.oppTargetIndex !== undefined && opp.bench[action.oppTargetIndex]
          ? action.oppTargetIndex
          : bench[0]!.index;
      gustBenchToActive(opp, idx);
      pushLog(state, pi, "gust", `Counter Catcher → ${opp.active?.cardName}`);
      return true;
    }
    case "Iono": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      player.supporterPlayedThisTurn = true;
      for (const p of state.players) {
        shuffleHandIntoDeck(p, ctx.rng);
        drawCards(p, p.prizeCount);
      }
      pushLog(state, pi, "draw", `Iono — draw to ${player.prizeCount}`);
      return true;
    }
    case "Professor's Research": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      // Discard entire hand including research
      for (const c of player.hand) player.discard.push(c);
      player.hand = [];
      player.discard.push(ref);
      player.supporterPlayedThisTurn = true;
      drawCards(player, 7);
      pushLog(state, pi, "draw", "Professor's Research — draw 7");
      return true;
    }
    case "Night Stretcher": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      const idx = player.discard.findIndex((c) => {
        if (c.instanceId === ref.instanceId) return false;
        const card = getCardById(c.cardId);
        return !!card && (card.supertype === "Pokémon" || isBasicEnergyCard(card));
      });
      if (idx >= 0) {
        const taken = player.discard.splice(idx, 1)[0]!;
        player.hand.push(taken);
        pushLog(state, pi, "recover", `Night Stretcher → ${taken.name}`);
      }
      return true;
    }
    case "Crushing Hammer": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      if (ctx.rng.chance(0.5) && opp.active && opp.active.energy.length > 0) {
        const e = opp.active.energy.pop()!;
        opp.discard.push(ctx.makeRef(`energy-${e}`, `${e} Energy`));
        pushLog(state, pi, "coin-heads", "Crushing Hammer discarded Energy");
      } else {
        pushLog(state, pi, "coin-tails", "Crushing Hammer missed");
      }
      return true;
    }
    case "Crispin": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      player.supporterPlayedThisTurn = true;
      const energies = player.deck
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => {
          const card = getCardById(c.cardId);
          return card ? isBasicEnergy(card) : false;
        });
      if (energies.length === 0) {
        player.deck = ctx.rng.shuffle(player.deck);
        return true;
      }
      const first = energies[0]!;
      const second = energies.find(
        (e) => e.c.name !== first.c.name && e.i !== first.i,
      );
      // attach first to active if possible
      const a = takeFromDeck(player, first.i);
      const et = energyTypeFromCardName(a.name);
      if (player.active && et) {
        player.active.energy.push(et);
      } else {
        player.hand.push(a);
      }
      if (second) {
        // indices may have shifted
        const hit2 = findInDeck(player, (c) => c.name === second.c.name);
        if (hit2) {
          const b = takeFromDeck(player, hit2.index);
          player.hand.push(b);
        }
      }
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "search", "Crispin attached Energy");
      return true;
    }
    case "Arven": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      player.supporterPlayedThisTurn = true;
      const item = findInDeck(player, (c) => {
        const card = getCardById(c.cardId);
        return !!card && card.subtypes.some((s) => s.toLowerCase() === "item");
      });
      if (item) {
        player.hand.push(takeFromDeck(player, item.index));
      }
      const tool = findInDeck(player, (c) => {
        const card = getCardById(c.cardId);
        return !!card && card.subtypes.some((s) => s.toLowerCase() === "tool");
      });
      if (tool) {
        player.hand.push(takeFromDeck(player, tool.index));
      }
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "search", "Arven tutored Item/Tool");
      return true;
    }
    case "Earthen Vessel": {
      const discards = action.discardHandIndices ?? [];
      discardFromHand(player, discards);
      const ref = player.hand.find((c) => c.name === "Earthen Vessel");
      const idx = ref ? player.hand.indexOf(ref) : hi;
      const vessel = removeHandIndex(player, idx);
      if (vessel) player.discard.push(vessel);
      let got = 0;
      for (let n = 0; n < 2; n++) {
        const hit = findInDeck(player, (c) => {
          const card = getCardById(c.cardId);
          return card ? isBasicEnergy(card) : false;
        });
        if (!hit) break;
        player.hand.push(takeFromDeck(player, hit.index));
        got++;
      }
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "search", `Earthen Vessel → ${got} Energy`);
      return true;
    }
    case "Switch": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      const bench = occupiedBench(player);
      if (bench.length && player.active) {
        const idx = action.benchIndex ?? bench[0]!.index;
        gustBenchToActive(player, idx);
        pushLog(state, pi, "switch", `Switch → ${player.active.cardName}`);
      }
      return true;
    }
    case "Super Rod": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      let moved = 0;
      for (let n = 0; n < 3; n++) {
        const idx = player.discard.findIndex((c) => {
          if (c.instanceId === ref.instanceId) return false;
          const card = getCardById(c.cardId);
          return !!card && (card.supertype === "Pokémon" || isBasicEnergyCard(card));
        });
        if (idx < 0) break;
        const taken = player.discard.splice(idx, 1)[0]!;
        player.deck.push(taken);
        moved++;
      }
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "recover", `Super Rod shuffled ${moved}`);
      return true;
    }
    case "Unfair Stamp": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      shuffleHandIntoDeck(opp, ctx.rng);
      drawCards(opp, 2);
      opp.abilityLocks["no-items"] = true;
      pushLog(state, pi, "disruption", "Unfair Stamp — opp draws 2, Items locked");
      return true;
    }
    case "Secret Box": {
      const discards = action.discardHandIndices ?? [];
      discardFromHand(player, discards);
      const box = player.hand.find((c) => c.name === "Secret Box");
      const idx = box ? player.hand.indexOf(box) : hi;
      const ref = removeHandIndex(player, idx);
      if (ref) player.discard.push(ref);
      const takeSubtype = (sub: string) => {
        const hit = findInDeck(player, (c) => {
          const card = getCardById(c.cardId);
          return !!card && card.subtypes.some((s) => s.toLowerCase() === sub);
        });
        if (hit) player.hand.push(takeFromDeck(player, hit.index));
      };
      takeSubtype("item");
      takeSubtype("supporter");
      takeSubtype("stadium");
      takeSubtype("tool");
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "search", "Secret Box toolbox");
      return true;
    }
    case "Lacey": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      player.supporterPlayedThisTurn = true;
      shuffleHandIntoDeck(player, ctx.rng);
      const n = opp.prizeCount <= 3 ? 8 : 4;
      drawCards(player, n);
      pushLog(state, pi, "draw", `Lacey — draw ${n}`);
      return true;
    }
    case "Pokégear 3.0": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      const top = player.deck.slice(0, 7);
      const sup = top.findIndex((c) =>
        getCardById(c.cardId)?.subtypes.some((s) => s.toLowerCase() === "supporter"),
      );
      if (sup >= 0) {
        player.hand.push(player.deck.splice(sup, 1)[0]!);
      }
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "search", "Pokégear 3.0");
      return true;
    }
    case "Poké Ball": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      if (ctx.rng.chance(0.5)) {
        const hit = findInDeck(player, (c) => getCardById(c.cardId)?.supertype === "Pokémon");
        if (hit) {
          player.hand.push(takeFromDeck(player, hit.index));
          pushLog(state, pi, "coin-heads", "Poké Ball found Pokémon");
        }
      } else {
        pushLog(state, pi, "coin-tails", "Poké Ball missed");
      }
      player.deck = ctx.rng.shuffle(player.deck);
      return true;
    }
    case "Energy Switch": {
      const ref = removeHandIndex(player, hi);
      if (!ref) return false;
      player.discard.push(ref);
      // Move one energy from active to first bench if possible
      if (player.active && player.active.energy.length > 0) {
        const bench = occupiedBench(player);
        if (bench.length) {
          const e = player.active.energy.pop()!;
          bench[0]!.pokemon.energy.push(e);
          pushLog(state, pi, "energy", "Energy Switch");
        }
      }
      return true;
    }
    default:
      return false;
  }
}

function applyAbility(state: GameState, action: Action, ctx: ScriptCtx): boolean {
  const pi = action.playerIndex;
  const player = state.players[pi]!;
  const opp = state.players[(1 - pi) as 0 | 1]!;
  const inst = action.evolveOntoInstanceId;
  if (!inst) return false;
  const mon = pokemonByInstance(player, inst);
  if (!mon) return false;
  const abilityName = action.abilityName ?? "";

  if (abilityName === "Recon Directive") {
    if (player.deck.length === 0) return false;
    const top = player.deck.splice(0, Math.min(2, player.deck.length));
    if (top.length === 0) return false;
    player.hand.push(top[0]!);
    if (top[1]) player.deck.push(top[1]);
    mon.abilityUsed = { ...mon.abilityUsed, [abilityName]: true };
    pushLog(state, pi, "ability", "Recon Directive");
    return true;
  }

  if (abilityName === "Boom Boom Groove") {
    const hit = findInDeck(player, (c) => c.name === "Festival Grounds");
    if (hit) {
      const stadium = takeFromDeck(player, hit.index);
      putStadiumInPlay(state, pi, stadium);
      player.deck = ctx.rng.shuffle(player.deck);
      pushLog(state, pi, "ability", "Boom Boom Groove → Festival Grounds");
    }
    mon.abilityUsed = { ...mon.abilityUsed, [abilityName]: true };
    return true;
  }

  if (abilityName === "Adrena-Brain") {
    if (mon.damage <= 0) return false;
    if (mon.cardName.includes("Fezandipiti")) {
      while (player.hand.length < 3 && player.deck.length > 0) {
        drawCards(player, 1);
      }
      pushLog(state, pi, "ability", "Adrena-Brain draw");
    } else if (mon.cardName === "Munkidori" && opp.active) {
      const move = Math.min(3, Math.floor(mon.damage / 10)) * 10;
      // move up to 3 counters (30) from self conceptually — from any own; simplify from self
      const from = Math.min(mon.damage, 30);
      mon.damage -= from;
      opp.active.damage += from || move;
      pushLog(state, pi, "ability", `Adrena-Brain moved ${from} damage`);
    }
    mon.abilityUsed = { ...mon.abilityUsed, [abilityName]: true };
    return true;
  }

  if (abilityName === "Cursed Blast") {
    // Place 5 damage counters (50) on opp active, KO self
    if (opp.active) opp.active.damage += 50;
    mon.damage = mon.maxHp;
    pushLog(state, pi, "ability", "Cursed Blast");
    mon.abilityUsed = { ...mon.abilityUsed, [abilityName]: true };
    return true;
  }

  return false;
}

function applyAttackEffect(state: GameState, action: Action, ctx: ScriptCtx): boolean {
  const pi = action.playerIndex;
  const player = state.players[pi]!;
  const opp = state.players[(1 - pi) as 0 | 1]!;
  if (!player.active) return false;
  const card = getCardById(player.active.cardId);
  const atk = card?.attacks?.[action.attackIndex ?? 0];
  if (!atk) return false;

  // Base damage to active
  let dmg = 0;
  const m = (atk.damage ?? "").match(/(\d+)/);
  if (m) dmg = Number(m[1]);

  // Weakness/resistance simple on active
  if (opp.active && card?.types?.[0] && dmg > 0) {
    const def = getCardById(opp.active.cardId);
    if (def?.weaknesses?.some((w) => w.type === card.types![0])) dmg *= 2;
    if (def?.resistances?.some((r) => r.type === card.types![0])) dmg = Math.max(0, dmg - 30);
  }

  if (atk.name === "Phantom Dive") {
    // 200 to active + 6 damage counters on bench (60 total), distributed
    if (opp.active) opp.active.damage += dmg || 200;
    const bench = occupiedBench(opp);
    let counters = 6;
    let i = 0;
    while (counters > 0 && bench.length > 0) {
      bench[i % bench.length]!.pokemon.damage += 10;
      counters--;
      i++;
    }
    pushLog(state, pi, "attack", "Phantom Dive");
    return true;
  }

  if (atk.name === "Festival Style" && state.stadium?.name === "Festival Grounds") {
    dmg += 90;
    if (player.active) player.active.damage = Math.max(0, player.active.damage - 30);
  }

  if (atk.name === "Do the Wave") {
    const benched = occupiedBench(player).length;
    dmg = 20 + 20 * benched;
  }

  if (opp.active && dmg > 0) {
    opp.active.damage += dmg;
  }

  // Cruel Arrow: can hit bench — default active
  if (atk.name === "Cruel Arrow" && action.oppTargetIndex !== undefined && action.oppTargetIndex >= 0) {
    const b = opp.bench[action.oppTargetIndex];
    if (b) {
      if (opp.active) opp.active.damage -= dmg; // undo active
      b.damage += 100;
    }
  }

  pushLog(state, pi, "attack", `${player.active.cardName} used ${atk.name}`);
  void ctx;
  return true;
}
