export type EnergyType =
  | "Grass"
  | "Fire"
  | "Water"
  | "Lightning"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Metal"
  | "Dragon"
  | "Fairy"
  | "Colorless";

export type Supertype = "Pokémon" | "Trainer" | "Energy";
export type TrainerSubtype = "Item" | "Supporter" | "Stadium" | "Tool" | "ACE SPEC";
export type PokemonStage = "Basic" | "Stage 1" | "Stage 2" | "VSTAR" | "ex" | "Mega";

export type RoleTag =
  | "starter"
  | "attacker"
  | "engine"
  | "tech"
  | "dead-draw"
  | "draw"
  | "search"
  | "gust"
  | "heal"
  | "disruption"
  | "ace-spec";

export interface CardAttack {
  name: string;
  cost: EnergyType[];
  damage?: string;
  text?: string;
  prizes?: 1 | 2 | 3;
}

export interface CardAbility {
  name: string;
  type: "Ability" | "Poké-Power" | "Poké-Body";
  text: string;
}

export interface TcgCard {
  id: string;
  /** Upstream PokemonTCG API id (e.g. sv6-130) when different from lab id */
  apiId?: string;
  name: string;
  setCode: string;
  setId?: string;
  setName: string;
  number: string;
  regulationMark: string;
  supertype: Supertype;
  subtypes: string[];
  hp?: number;
  types?: EnergyType[];
  evolvesFrom?: string;
  attacks?: CardAttack[];
  abilities?: CardAbility[];
  weaknesses?: { type: EnergyType; value: string }[];
  resistances?: { type: EnergyType; value: string }[];
  retreat?: number;
  rules?: string[];
  rarity?: string;
  artist?: string;
  imageSmall?: string;
  imageLarge?: string;
  ptcgoCode?: string;
  legalities: { standard?: string; expanded?: string };
  /** Competitive annotations */
  roles?: RoleTag[];
  whenGood?: string;
  whenBrick?: string;
  scripted?: boolean;
}

export interface TcgSet {
  id: string;
  code: string;
  name: string;
  series: string;
  releaseDate: string;
  ptcgoCode?: string;
  symbol?: string;
  logo?: string;
  legalCardCount: number;
  marks: string[];
}

export interface DeckEntry {
  count: number;
  card: TcgCard;
}

export interface DeckList {
  name: string;
  entries: DeckEntry[];
  archetypeId?: string;
}

export interface SimCaveat {
  text: string;
}

export const SIM_CAVEAT: SimCaveat = {
  text: "These numbers are engine + agent, not Worlds truth. Win rates track agent strength, not just card fidelity.",
};
