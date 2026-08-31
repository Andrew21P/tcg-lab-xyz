"use client";

import { useMemo, useState } from "react";
import { getCardsBySet, getLegalSets } from "@/lib/cards";
import { CardTile } from "@/components/card-tile";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Supertype } from "@/lib/types";

const SUPERTYPES: Array<Supertype | "All"> = [
  "All",
  "Pokémon",
  "Trainer",
  "Energy",
];

export default function SetBrowser({ code }: { code: string }) {
  const set = getLegalSets().find(
    (s) => s.code.toUpperCase() === code.toUpperCase(),
  )!;

  const allCards = useMemo(() => getCardsBySet(set.code), [set.code]);
  const [query, setQuery] = useState("");
  const [supertype, setSupertype] = useState<Supertype | "All">("All");

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCards.filter((c) => {
      if (supertype !== "All" && c.supertype !== supertype) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.number.includes(q) ||
        c.subtypes.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [allCards, query, supertype]);

  return (
    <PageShell>
      <PageHeader
        eyebrow={set.series}
        title={set.name}
        description={`${allCards.length} Standard-legal cards · released ${set.releaseDate}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <span className="lab-chip font-mono">{set.code}</span>
            {set.marks.map((m) => (
              <span key={m} className="mark-badge">
                {m}
              </span>
            ))}
            <Badge tone="amber">{allCards.length} legal</Badge>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or number…"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-1">
          {SUPERTYPES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSupertype(s)}
              className={
                supertype === s
                  ? "lab-chip border-teal-400/50 text-teal-200"
                  : "lab-chip"
              }
            >
              {s}
            </button>
          ))}
        </div>
        <Badge tone="cyan">{cards.length} shown</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} compact />
        ))}
      </div>
    </PageShell>
  );
}
