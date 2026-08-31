import type { RoleTag } from "../types";

export const ROLE_LABELS: Record<RoleTag, string> = {
  starter: "Starter",
  attacker: "Attacker",
  engine: "Engine",
  tech: "Tech",
  "dead-draw": "Dead draw",
  draw: "Draw",
  search: "Search",
  gust: "Gust",
  heal: "Heal",
  disruption: "Disruption",
  "ace-spec": "ACE SPEC",
};

const ROLE_COLORS: Record<RoleTag, string> = {
  starter: "#5b8c5a",
  attacker: "#c44b4b",
  engine: "#3d7ea6",
  tech: "#8a6d3b",
  "dead-draw": "#6b6b6b",
  draw: "#4a90a4",
  search: "#6b8e23",
  gust: "#b85c38",
  heal: "#2e8b57",
  disruption: "#7a4e9b",
  "ace-spec": "#b8860b",
};

export function getRoleColor(role: RoleTag): string {
  return ROLE_COLORS[role] ?? "#666666";
}
