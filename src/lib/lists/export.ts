import type { DeckEntry } from "@/lib/types";

export function exportToLimitlessText(entries: DeckEntry[]): string {
  const pokemon = entries.filter((e) => e.card.supertype === "Pokémon");
  const trainer = entries.filter((e) => e.card.supertype === "Trainer");
  const energy = entries.filter((e) => e.card.supertype === "Energy");

  const lines: string[] = [];
  const pokeCount = pokemon.reduce((s, e) => s + e.count, 0);
  lines.push(`Pokémon: ${pokeCount}`);
  for (const e of pokemon) {
    lines.push(`${e.count} ${e.card.name} ${e.card.setCode} ${e.card.number}`);
  }
  lines.push("");
  const trainerCount = trainer.reduce((s, e) => s + e.count, 0);
  lines.push(`Trainer: ${trainerCount}`);
  for (const e of trainer) {
    lines.push(`${e.count} ${e.card.name} ${e.card.setCode} ${e.card.number}`);
  }
  lines.push("");
  const energyCount = energy.reduce((s, e) => s + e.count, 0);
  lines.push(`Energy: ${energyCount}`);
  for (const e of energy) {
    lines.push(`${e.count} ${e.card.name} ${e.card.setCode} ${e.card.number}`);
  }
  return lines.join("\n");
}

export function exportToPtcglText(entries: DeckEntry[]): string {
  // PTCGL-style flat list with section headers
  return exportToLimitlessText(entries);
}
