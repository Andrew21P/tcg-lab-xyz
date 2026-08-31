"use client";

import { useState } from "react";
import type { DeckEntry } from "@/lib/types";
import { TOP8 } from "@/lib/archetypes";
import { parseDeckList } from "@/lib/lists/parse";
import { runMatchup, runMatchupVsArchetype } from "@/lib/analysis/matchup";
import { MatchupReport, type MatchupResult } from "@/components/matchup-report";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MatchupPage() {
  const [listA, setListA] = useState("");
  const [listB, setListB] = useState("");
  const [archetypeId, setArchetypeId] = useState(TOP8[0]?.id ?? "");
  const [mode, setMode] = useState<"list" | "archetype">("archetype");
  const [games, setGames] = useState(40);
  const [seed, setSeed] = useState(7);
  const [result, setResult] = useState<MatchupResult | null>(null);
  const [titleB, setTitleB] = useState("Opponent");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function entries(text: string): DeckEntry[] {
    return parseDeckList(text).entries;
  }

  function run() {
    const a = entries(listA);
    if (a.length === 0) {
      setMessage("Parse list A first (paste + enough lines).");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (mode === "archetype") {
        const report = runMatchupVsArchetype(a, archetypeId, { games, seed });
        setResult(report);
        setTitleB(TOP8.find((t) => t.id === archetypeId)?.name ?? archetypeId);
      } else {
        const b = entries(listB);
        if (b.length === 0) {
          setMessage("Parse list B or switch to TOP8 archetype mode.");
          setBusy(false);
          return;
        }
        const report = runMatchup(a, b, { games, seed });
        setResult(report);
        setTitleB("List B");
      }
    } catch (err) {
      console.error(err);
      setMessage("Matchup sim failed — engine/analysis may still be wiring up.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Matchup Lab"
        title="G1 · G2 · Bo3"
        description="Pit your list against another 60 or a TOP8 consensus archetype. Bars are engine + agent — not Worlds truth."
        actions={<Badge tone="amber">seed {seed}</Badge>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "archetype" ? "default" : "secondary"}
          onClick={() => setMode("archetype")}
        >
          vs TOP8 archetype
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "list" ? "default" : "secondary"}
          onClick={() => setMode("list")}
        >
          vs pasted list
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lab-panel space-y-2 p-4">
          <h3 className="font-heading text-sm font-semibold">Your list</h3>
          <Textarea
            value={listA}
            onChange={(e) => setListA(e.target.value)}
            className="min-h-[220px]"
            placeholder="Paste Limitless / PTCGL export"
          />
        </div>
        <div className="lab-panel space-y-2 p-4">
          {mode === "archetype" ? (
            <>
              <h3 className="font-heading text-sm font-semibold">TOP8 archetype</h3>
              <select
                value={archetypeId}
                onChange={(e) => setArchetypeId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-[#0a0e14] px-3 text-sm"
              >
                {TOP8.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                {TOP8.find((a) => a.id === archetypeId)?.description}
              </p>
            </>
          ) : (
            <>
              <h3 className="font-heading text-sm font-semibold">Opponent list</h3>
              <Textarea
                value={listB}
                onChange={(e) => setListB(e.target.value)}
                className="min-h-[220px]"
                placeholder="Paste opposing 60"
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Games
          <Input
            type="number"
            className="w-24"
            value={games}
            onChange={(e) => setGames(Number(e.target.value) || 20)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Seed
          <Input
            type="number"
            className="w-24"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
          />
        </label>
        <Button type="button" onClick={run} disabled={busy}>
          {busy ? "Simulating…" : "Run matchup"}
        </Button>
      </div>

      {message && <p className="mt-3 text-sm text-cyan-300">{message}</p>}

      {result && (
        <div className="mt-8">
          <MatchupReport result={result} titleA="Your list" titleB={titleB} />
        </div>
      )}
    </PageShell>
  );
}
