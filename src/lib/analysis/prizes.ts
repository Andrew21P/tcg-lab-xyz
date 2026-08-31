import type { TcgCard } from "@/lib/types";
import { prizeValueForCard, parseDamageString } from "@/lib/engine/actions";

export type PrizeMapResult = {
  prizesThisAttack: 1 | 2 | 3;
  damageDealt: number;
  defenderHpRemaining: number;
  isKo: boolean;
  attachmentsUntilLethal: number;
  comebackRisk: string;
  notes: string[];
};

/**
 * Prize-map math for Board Lab / Prizes page.
 */
export function prizeMap(
  attacker: TcgCard,
  defender: TcgCard,
  damageOnDefender: number,
  energyAttached: number,
): PrizeMapResult {
  const attacks = attacker.attacks ?? [];
  // Pick strongest affordable attack
  let best = attacks[0];
  let bestDmg = 0;
  for (const atk of attacks) {
    const costOk = energyAttached >= atk.cost.length;
    const dmg = parseDamageString(atk.damage);
    if (costOk && dmg >= bestDmg) {
      best = atk;
      bestDmg = dmg;
    }
  }

  let dmg = bestDmg;
  // Weakness
  if (attacker.types?.[0] && defender.weaknesses?.some((w) => w.type === attacker.types![0])) {
    dmg *= 2;
  }
  if (attacker.types?.[0] && defender.resistances?.some((r) => r.type === attacker.types![0])) {
    dmg = Math.max(0, dmg - 30);
  }

  const maxHp = defender.hp ?? 100;
  const remainingBefore = Math.max(0, maxHp - damageOnDefender);
  const remainingAfter = Math.max(0, remainingBefore - dmg);
  const isKo = remainingAfter <= 0;

  const notes: string[] = [];
  if (best) notes.push(`Reference attack: ${best.name} (${bestDmg}${dmg !== bestDmg ? ` → ${dmg} after W/R` : ""})`);
  if (isKo) notes.push(`KO yields ${best?.prizes ?? prizeValueForCard(defender)} prize(s).`);

  let comebackRisk = "Low — no obvious Fezandipiti/Dusknoir swing from this chip.";
  if (!isKo && remainingAfter > 0 && remainingAfter <= 60) {
    comebackRisk =
      "High — leftover chip enables Fezandipiti Adrena-Brain or Dusknoir Cursed Blast finish lines.";
  } else if (isKo && (best?.prizes ?? prizeValueForCard(defender)) === 1) {
    comebackRisk =
      "Medium — single-prize KO can feed Fezandipiti draw engines on the opponent's board.";
  } else if (isKo && (best?.prizes ?? prizeValueForCard(defender)) >= 2) {
    comebackRisk = "Watch prize map — multi-prize KO may put you in Counter Catcher range.";
  }

  const prizesOnKo: 1 | 2 | 3 = best?.prizes ?? prizeValueForCard(defender);

  let attachmentsUntilLethal = 0;
  if (!isKo && bestDmg > 0) {
    const hits = Math.ceil(remainingBefore / bestDmg);
    const energyNeeded = (best?.cost.length ?? 1) + Math.max(0, hits - 1);
    attachmentsUntilLethal = Math.max(0, energyNeeded - energyAttached);
  }

  return {
    prizesThisAttack: prizesOnKo,
    damageDealt: dmg,
    defenderHpRemaining: remainingAfter,
    isKo,
    attachmentsUntilLethal,
    comebackRisk,
    notes,
  };
}
