"use client";

import { useMemo, useState } from "react";
import { getAllCards, searchCards } from "@/lib/cards";
import { prizeMap } from "@/lib/analysis/prizes";
import { PrizeMapPanel, type PrizeMapResult } from "@/components/prize-map-panel";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PrizesPage() {
  const attackers = useMemo(
    () =>
      searchCards("", { roles: ["attacker"] }).length
        ? searchCards("", { roles: ["attacker"] }).slice(0, 40)
        : getAllCards().filter((c) => c.supertype === "Pokémon").slice(0, 40),
    [],
  );
  const defenders = useMemo(
    () => getAllCards().filter((c) => c.supertype === "Pokémon").slice(0, 60),
    [],
  );

  const [attackerId, setAttackerId] = useState(attackers[0]?.id ?? "");
  const [defenderId, setDefenderId] = useState(defenders[0]?.id ?? "");
  const [damage, setDamage] = useState(0);
  const [energy, setEnergy] = useState(2);
  const [result, setResult] = useState<PrizeMapResult | null>(null);
  const [message, setMessage] = useState("");

  const attacker = attackers.find((c) => c.id === attackerId) ?? getAllCards().find((c) => c.id === attackerId);
  const defender = defenders.find((c) => c.id === defenderId) ?? getAllCards().find((c) => c.id === defenderId);

  function run() {
    if (!attacker || !defender) {
      setMessage("Pick both Pokémon.");
      return;
    }
    try {
      const map = prizeMap(attacker, defender, damage, energy) as PrizeMapResult;
      setResult(map);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("prizeMap failed.");
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Prize Lab"
        title="Prize map & tempo"
        description="Ask how many prizes an attack is worth, how many attaches until lethal, and whether a small KO feeds a comeback engine."
        actions={<Badge tone="amber">not just KO math</Badge>}
      />

      <div className="lab-panel grid gap-4 p-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Attacker</span>
          <select
            value={attackerId}
            onChange={(e) => setAttackerId(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-[#0a0e14] px-3"
          >
            {attackers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.setCode})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Defender</span>
          <select
            value={defenderId}
            onChange={(e) => setDefenderId(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-[#0a0e14] px-3"
          >
            {defenders.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.setCode}) {c.hp ? `· ${c.hp}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Damage already on defender</span>
          <Input
            type="number"
            value={damage}
            onChange={(e) => setDamage(Number(e.target.value) || 0)}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Energy attached to attacker</span>
          <Input
            type="number"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="mt-4">
        <Button type="button" onClick={run}>
          Compute prize map
        </Button>
        {message && <p className="mt-2 text-sm text-cyan-300">{message}</p>}
      </div>

      {result && attacker && defender && (
        <div className="mt-8">
          <PrizeMapPanel
            attackerName={attacker.name}
            defenderName={defender.name}
            result={result}
          />
        </div>
      )}
    </PageShell>
  );
}
