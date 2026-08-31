import type { EnergyType, TcgCard } from "@/lib/types";
import { getCardById, getCardsByName, isBasicPokemon } from "@/lib/cards";
import type { GameState, PokemonInPlay, PlayerState } from "./state";
import { allInPlay, emptyBenchSlots, occupiedBench, remainingHp } from "./state";
import { isScripted, SCRIPTED_TRAINERS } from "./scripts";

export type ActionType =
  | "playBasic"
  | "evolve"
  | "attachEnergy"
  | "playItem"
  | "playSupporter"
  | "playStadium"
  | "playTool"
  | "retreat"
  | "attack"
  | "ability"
  | "takePrize"
  | "pass"
  | "concede";

export type Action = {
  type: ActionType;
  playerIndex: 0 | 1;
  /** Index into hand for the card being played */
  handIndex?: number;
  cardId?: string;
  cardName?: string;
  /** Bench slot 0–4; for playBasic also -1 means active if empty */
  benchIndex?: number;
  /** Target Pokémon: -1 = active, 0–4 = bench */
  targetIndex?: number;
  /** Opponent target for gust */
  oppTargetIndex?: number;
  attackIndex?: number;
  abilityName?: string;
  /** Hand indices to discard (Ultra Ball, etc.) */
  discardHandIndices?: number[];
  /** Evolve: hand Stage card onto this in-play Pokémon */
  evolveOntoInstanceId?: string;
  label?: string;
};

const ENERGY_TYPES: EnergyType[] = [
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
];

export function energyTypeFromCardName(name: string): EnergyType | null {
  for (const t of ENERGY_TYPES) {
    if (name === `${t} Energy`) return t;
  }
  return null;
}

export function isBasicEnergyCard(card: TcgCard): boolean {
  return card.supertype === "Energy" && card.subtypes.includes("Basic");
}

export function festivalLeadCount(player: PlayerState): number {
  return allInPlay(player).filter((p) =>
    (getCardById(p.cardId)?.abilities ?? []).some((a) => a.name === "Festival Lead"),
  ).length;
}

export function festivalGroundsInPlay(state: GameState): boolean {
  return state.stadium?.name === "Festival Grounds";
}

/**
 * Simplified energy payment: typed costs must match; Colorless can be any.
 * Festival Lead + Festival Grounds reduces Colorless cost by 1 per stadium (max 1 stadium).
 */
export function canPayAttackCost(
  state: GameState,
  player: PlayerState,
  pokemon: PokemonInPlay,
  cost: EnergyType[],
): boolean {
  let colorlessNeeded = cost.filter((c) => c === "Colorless").length;
  const typedNeeded = cost.filter((c) => c !== "Colorless");

  if (
    festivalGroundsInPlay(state) &&
    (getCardById(pokemon.cardId)?.abilities ?? []).some((a) => a.name === "Festival Lead")
  ) {
    colorlessNeeded = Math.max(0, colorlessNeeded - 1);
  }

  const pool = [...pokemon.energy];
  for (const need of typedNeeded) {
    const strict = pool.findIndex((e) => e === need);
    if (strict >= 0) {
      pool.splice(strict, 1);
    } else {
      return false;
    }
  }
  return pool.length >= colorlessNeeded;
}

export function parseDamageString(dmg?: string): number {
  if (!dmg) return 0;
  const m = dmg.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export function prizeValueForCard(card: TcgCard): 1 | 2 | 3 {
  const rules = (card.rules ?? []).join(" ").toLowerCase();
  if (rules.includes("3 prize") || rules.includes("three prize")) return 3;
  if (
    card.subtypes.some((s) => ["ex", "V", "VMAX", "VSTAR", "Mega", "ex"].includes(s)) ||
    /\bex\b/i.test(card.name) ||
    /^Mega\b/i.test(card.name) ||
    rules.includes("2 prize") ||
    rules.includes("takes 2 prize")
  ) {
    return 2;
  }
  return 1;
}

function handCard(state: GameState, playerIndex: number, handIndex: number) {
  return state.players[playerIndex]!.hand[handIndex];
}

function cardFromHand(state: GameState, playerIndex: number, handIndex: number): TcgCard | undefined {
  const ref = handCard(state, playerIndex, handIndex);
  if (!ref) return undefined;
  return getCardById(ref.cardId);
}

/**
 * Honest subset of legal actions for scripted cards.
 * Unscripted trainers do not appear in the list.
 */
export function getLegalActions(state: GameState, playerIndex: number): Action[] {
  if (state.phase === "game-over") return [];
  if (state.phase !== "player-turn" && state.phase !== "setup") {
    // Between / attack phases: allow prize take / pass housekeeping via game layer
  }
  if (state.activePlayer !== playerIndex && state.phase === "player-turn") {
    return [{ type: "concede", playerIndex: playerIndex as 0 | 1, label: "Concede" }];
  }

  const actions: Action[] = [];
  const pi = playerIndex as 0 | 1;
  const player = state.players[pi]!;
  const opp = state.players[(1 - pi) as 0 | 1]!;

  actions.push({ type: "pass", playerIndex: pi, label: "Pass / End turn" });
  actions.push({ type: "concede", playerIndex: pi, label: "Concede" });

  // Play Basics
  const openBench = emptyBenchSlots(player);
  for (let hi = 0; hi < player.hand.length; hi++) {
    const card = cardFromHand(state, pi, hi);
    if (!card || !isBasicPokemon(card)) continue;
    if (!player.active) {
      actions.push({
        type: "playBasic",
        playerIndex: pi,
        handIndex: hi,
        cardId: card.id,
        cardName: card.name,
        benchIndex: -1,
        label: `Play ${card.name} to Active`,
      });
    }
    for (const slot of openBench) {
      actions.push({
        type: "playBasic",
        playerIndex: pi,
        handIndex: hi,
        cardId: card.id,
        cardName: card.name,
        benchIndex: slot,
        label: `Play ${card.name} to Bench ${slot + 1}`,
      });
    }
  }

  // Evolve (manual Stage 1 / Stage 2 onto evolvesFrom) — not turn-1 evolve for simplicity allow always after setup
  if (state.turn >= 1 || state.firstPlayer !== pi) {
    for (let hi = 0; hi < player.hand.length; hi++) {
      const card = cardFromHand(state, pi, hi);
      if (!card || card.supertype !== "Pokémon" || !card.evolvesFrom) continue;
      const targets = allInPlay(player).filter((p) => p.cardName === card.evolvesFrom);
      for (const t of targets) {
        const onActive = player.active?.instanceId === t.instanceId;
        const benchIdx = player.bench.findIndex((b) => b?.instanceId === t.instanceId);
        actions.push({
          type: "evolve",
          playerIndex: pi,
          handIndex: hi,
          cardId: card.id,
          cardName: card.name,
          evolveOntoInstanceId: t.instanceId,
          targetIndex: onActive ? -1 : benchIdx,
          label: `Evolve ${t.cardName} into ${card.name}`,
        });
      }
    }
  }

  // Attach energy (1 per turn)
  if (player.energyAttachedThisTurn < 1 && player.active) {
    for (let hi = 0; hi < player.hand.length; hi++) {
      const card = cardFromHand(state, pi, hi);
      if (!card || !isBasicEnergyCard(card)) continue;
      const et = energyTypeFromCardName(card.name) ?? card.types?.[0];
      if (!et) continue;
      const targets: { idx: number; name: string }[] = [
        { idx: -1, name: player.active.cardName },
      ];
      for (const { index, pokemon } of occupiedBench(player)) {
        targets.push({ idx: index, name: pokemon.cardName });
      }
      for (const t of targets) {
        actions.push({
          type: "attachEnergy",
          playerIndex: pi,
          handIndex: hi,
          cardId: card.id,
          cardName: card.name,
          targetIndex: t.idx,
          label: `Attach ${card.name} to ${t.name}`,
        });
      }
    }
  }

  // Trainers — only scripted names
  for (let hi = 0; hi < player.hand.length; hi++) {
    const ref = player.hand[hi]!;
    const card = getCardById(ref.cardId);
    if (!card || card.supertype !== "Trainer") continue;
    if (!isScripted(card.name) && !SCRIPTED_TRAINERS.has(card.name)) continue;

    const subtypes = card.subtypes.map((s) => s.toLowerCase());
    const isItem = subtypes.includes("item") || subtypes.includes("ace spec");
    const isSupporter = subtypes.includes("supporter");
    const isStadium = subtypes.includes("stadium");
    const isTool = subtypes.includes("tool");

    if (isSupporter && player.supporterPlayedThisTurn) continue;
    if (isStadium) {
      actions.push({
        type: "playStadium",
        playerIndex: pi,
        handIndex: hi,
        cardId: card.id,
        cardName: card.name,
        label: `Play Stadium ${card.name}`,
      });
      continue;
    }
    if (isTool && player.active && !player.active.tool) {
      actions.push({
        type: "playTool",
        playerIndex: pi,
        handIndex: hi,
        cardId: card.id,
        cardName: card.name,
        targetIndex: -1,
        label: `Attach Tool ${card.name}`,
      });
      continue;
    }

    // Gate card-specific legality
    if (!trainerIsLegal(state, pi, card.name, hi)) continue;

    if (isSupporter) {
      actions.push({
        type: "playSupporter",
        playerIndex: pi,
        handIndex: hi,
        cardId: card.id,
        cardName: card.name,
        label: `Play ${card.name}`,
        ...gustDefaults(state, pi, card.name),
      });
    } else if (isItem) {
      // Ultra Ball needs 2 other cards to discard — generate one option
      if (card.name === "Ultra Ball") {
        const others = player.hand
          .map((_, i) => i)
          .filter((i) => i !== hi);
        if (others.length < 2) continue;
        actions.push({
          type: "playItem",
          playerIndex: pi,
          handIndex: hi,
          cardId: card.id,
          cardName: card.name,
          discardHandIndices: [others[0]!, others[1]!],
          label: "Play Ultra Ball",
        });
      } else if (card.name === "Earthen Vessel") {
        const others = player.hand.map((_, i) => i).filter((i) => i !== hi);
        if (others.length < 1) continue;
        actions.push({
          type: "playItem",
          playerIndex: pi,
          handIndex: hi,
          cardId: card.id,
          cardName: card.name,
          discardHandIndices: [others[0]!],
          label: "Play Earthen Vessel",
        });
      } else if (card.name === "Secret Box") {
        const others = player.hand.map((_, i) => i).filter((i) => i !== hi);
        if (others.length < 3) continue;
        actions.push({
          type: "playItem",
          playerIndex: pi,
          handIndex: hi,
          cardId: card.id,
          cardName: card.name,
          discardHandIndices: others.slice(0, 3),
          label: "Play Secret Box",
        });
      } else if (card.name === "Counter Catcher") {
        if (player.prizeCount <= opp.prizeCount) continue;
        if (occupiedBench(opp).length === 0) continue;
        for (const { index, pokemon } of occupiedBench(opp)) {
          actions.push({
            type: "playItem",
            playerIndex: pi,
            handIndex: hi,
            cardId: card.id,
            cardName: card.name,
            oppTargetIndex: index,
            label: `Counter Catcher → ${pokemon.cardName}`,
          });
        }
      } else if (card.name === "Rare Candy") {
        for (let s2i = 0; s2i < player.hand.length; s2i++) {
          if (s2i === hi) continue;
          const s2 = getCardById(player.hand[s2i]!.cardId);
          if (!s2 || !s2.subtypes.includes("Stage 2") || !s2.evolvesFrom) continue;
          const basicName = findBasicNameForStage2(s2);
          if (!basicName) continue;
          for (const p of allInPlay(player)) {
            if (p.cardName !== basicName) continue;
            const onActive = player.active?.instanceId === p.instanceId;
            const benchIdx = player.bench.findIndex((b) => b?.instanceId === p.instanceId);
            actions.push({
              type: "playItem",
              playerIndex: pi,
              handIndex: hi,
              cardId: card.id,
              cardName: card.name,
              discardHandIndices: [s2i],
              evolveOntoInstanceId: p.instanceId,
              targetIndex: onActive ? -1 : benchIdx,
              label: `Rare Candy ${p.cardName} → ${s2.name}`,
            });
          }
        }
      } else {
        actions.push({
          type: "playItem",
          playerIndex: pi,
          handIndex: hi,
          cardId: card.id,
          cardName: card.name,
          label: `Play ${card.name}`,
        });
      }
    }
  }

  // Boss's Orders gust targets
  // (already included via playSupporter + gustDefaults)

  // Retreat
  if (player.active && !player.retreatUsed && occupiedBench(player).length > 0) {
    const card = getCardById(player.active.cardId);
    let retreat = card?.retreat ?? 0;
    if (
      festivalGroundsInPlay(state) &&
      (card?.abilities ?? []).some((a) => a.name === "Festival Lead")
    ) {
      retreat = 0;
    }
    if (player.active.energy.length >= retreat) {
      for (const { index, pokemon } of occupiedBench(player)) {
        actions.push({
          type: "retreat",
          playerIndex: pi,
          benchIndex: index,
          label: `Retreat → ${pokemon.cardName}`,
        });
      }
    }
  }

  // Abilities
  for (const p of allInPlay(player)) {
    const card = getCardById(p.cardId);
    if (!card?.abilities) continue;
    for (const ab of card.abilities) {
      if (p.abilityUsed?.[ab.name] || player.abilityLocks[ab.name]) continue;
      if (ab.name === "Recon Directive" && player.deck.length >= 1) {
        actions.push({
          type: "ability",
          playerIndex: pi,
          abilityName: ab.name,
          cardName: p.cardName,
          evolveOntoInstanceId: p.instanceId,
          label: `${p.cardName}: Recon Directive`,
        });
      }
      if (
        ab.name === "Boom Boom Groove" ||
        (p.cardName === "Thwackey" && ab.name === "Festival Lead")
      ) {
        // Catalog may list Festival Lead on Thwackey; engine uses Boom Boom Groove search
        actions.push({
          type: "ability",
          playerIndex: pi,
          abilityName: "Boom Boom Groove",
          cardName: p.cardName,
          evolveOntoInstanceId: p.instanceId,
          label: `${p.cardName}: Boom Boom Groove`,
        });
      }
      if (ab.name === "Adrena-Brain" && p.damage > 0) {
        if (p.cardName.includes("Fezandipiti")) {
          actions.push({
            type: "ability",
            playerIndex: pi,
            abilityName: ab.name,
            cardName: p.cardName,
            evolveOntoInstanceId: p.instanceId,
            label: `${p.cardName}: Adrena-Brain`,
          });
        } else if (p.cardName === "Munkidori" && opp.active) {
          actions.push({
            type: "ability",
            playerIndex: pi,
            abilityName: ab.name,
            cardName: p.cardName,
            evolveOntoInstanceId: p.instanceId,
            targetIndex: -1,
            label: `${p.cardName}: Adrena-Brain → Active`,
          });
        }
      }
      if (ab.name === "Cursed Blast") {
        actions.push({
          type: "ability",
          playerIndex: pi,
          abilityName: ab.name,
          cardName: p.cardName,
          evolveOntoInstanceId: p.instanceId,
          label: `${p.cardName}: Cursed Blast`,
        });
      }
    }
  }

  // Attacks
  if (player.active && !player.active.conditions.asleep && !player.active.conditions.paralyzed) {
    const card = getCardById(player.active.cardId);
    const attacks = card?.attacks ?? [];
    for (let ai = 0; ai < attacks.length; ai++) {
      const atk = attacks[ai]!;
      if (!canPayAttackCost(state, player, player.active, atk.cost)) continue;
      actions.push({
        type: "attack",
        playerIndex: pi,
        attackIndex: ai,
        cardName: player.active.cardName,
        label: `Attack: ${atk.name}`,
      });
    }
  }

  // Take prize if pending KOs left prizes and empty active handled in game — expose takePrize when prizes faceUp
  const faceUp = player.prizes.filter((p) => p.faceUp);
  if (faceUp.length > 0) {
    for (let i = 0; i < player.prizes.length; i++) {
      if (!player.prizes[i]?.faceUp) continue;
      actions.push({
        type: "takePrize",
        playerIndex: pi,
        targetIndex: i,
        label: `Take prize ${i + 1}`,
      });
    }
  }

  return actions;
}

function gustDefaults(
  state: GameState,
  pi: 0 | 1,
  name: string,
): Partial<Action> {
  if (name !== "Boss's Orders") return {};
  const opp = state.players[(1 - pi) as 0 | 1]!;
  const bench = occupiedBench(opp);
  if (bench.length === 0) return {};
  // Prefer lowest remaining HP for KO setups
  const best = [...bench].sort(
    (a, b) => remainingHp(a.pokemon) - remainingHp(b.pokemon),
  )[0]!;
  return { oppTargetIndex: best.index };
}

function trainerIsLegal(
  state: GameState,
  pi: 0 | 1,
  name: string,
  _handIndex: number,
): boolean {
  const player = state.players[pi]!;
  const opp = state.players[(1 - pi) as 0 | 1]!;
  switch (name) {
    case "Nest Ball":
    case "Buddy-Buddy Poffin":
      return emptyBenchSlots(player).length > 0 && player.deck.some((c) => {
        const card = getCardById(c.cardId);
        return card ? isBasicPokemon(card) : false;
      });
    case "Boss's Orders":
      return occupiedBench(opp).length > 0;
    case "Counter Catcher":
      return player.prizeCount > opp.prizeCount && occupiedBench(opp).length > 0;
    case "Night Stretcher":
      return player.discard.some((c) => {
        const card = getCardById(c.cardId);
        return card && (card.supertype === "Pokémon" || isBasicEnergyCard(card));
      });
    case "Crushing Hammer":
      return (opp.active?.energy.length ?? 0) > 0;
    case "Switch":
      return occupiedBench(player).length > 0;
    case "Rare Candy":
      return true; // filtered when generating actions
    case "Ultra Ball":
      return player.hand.length >= 3; // ball + 2 discards
    default:
      return true;
  }
}

/** Walk evolvesFrom chain to Basic name for a Stage 2 card. */
export function findBasicNameForStage2(stage2: TcgCard): string | null {
  if (!stage2.evolvesFrom) return null;
  const s1 = getCardsByName(stage2.evolvesFrom)[0];
  if (!s1?.evolvesFrom) return stage2.evolvesFrom;
  return s1.evolvesFrom;
}
