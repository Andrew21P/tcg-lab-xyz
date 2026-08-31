"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getLegalSets,
  getStaples,
  searchCards,
  type CardSearchFilters,
} from "@/lib/cards";
import { FORMAT_NAME, LEGAL_MARKS } from "@/lib/format";
import type { EnergyType, Supertype } from "@/lib/types";
import { CardTile } from "@/components/card-tile";
import { SetCard } from "@/components/set-card";
import { PageShell } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SUPERTYPES: Array<Supertype | ""> = ["", "Pokémon", "Trainer", "Energy"];
const ENERGY_TYPES: Array<EnergyType | ""> = [
  "",
  "Grass",
  "Fire",
  "Water",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Metal",
  "Dragon",
  "Colorless",
];

export default function CardLabPage() {
  const sets = useMemo(() => getLegalSets(), []);
  const staples = useMemo(() => getStaples().slice(0, 12), []);
  const [query, setQuery] = useState("");
  const [supertype, setSupertype] = useState<Supertype | "">("");
  const [mark, setMark] = useState("");
  const [type, setType] = useState<EnergyType | "">("");

  const results = useMemo(() => {
    const filters: CardSearchFilters = {};
    if (supertype) filters.supertype = supertype;
    if (mark) filters.regulationMark = mark;
    if (type) filters.type = type;
    return searchCards(query, filters).slice(0, 48);
  }, [query, supertype, mark, type]);

  const searching = query.trim().length > 0 || !!supertype || !!mark || !!type;

  return (
    <PageShell>
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-border/80 bg-[rgba(17,24,32,0.92)] p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="lab-chip mb-4 border-teal-400/40 text-teal-200">
            {FORMAT_NAME} · marks {LEGAL_MARKS.join("/")}
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5eead4] via-[#7c8cff] to-[#a5b4fc]">
              TCG Lab XYZ
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Import a list or Live log, put the board on the table, and measure whether the
            next card you cut actually wins more prizes.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => document.getElementById("search")?.focus()}
            >
              Browse cards
            </Button>
            <Link href="/list">
              <Button type="button" variant="secondary">
                Open List Lab
              </Button>
            </Link>
            <Link href="/board">
              <Button type="button" variant="ghost">
                Board sandbox
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">Search the format</h2>
            <p className="text-sm text-muted-foreground">
              Filter by type, regulation mark, and supertype.
            </p>
          </div>
          <Badge tone="cyan">{results.length} shown</Badge>
        </div>
        <div className="lab-panel mb-4 grid gap-3 p-4 md:grid-cols-4">
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, set, number…"
            className="md:col-span-2"
          />
          <select
            value={supertype}
            onChange={(e) => setSupertype(e.target.value as Supertype | "")}
            className="h-10 rounded-lg border border-border bg-[#0a0e14] px-3 text-sm"
          >
            {SUPERTYPES.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All supertypes"}
              </option>
            ))}
          </select>
          <select
            value={mark}
            onChange={(e) => setMark(e.target.value)}
            className="h-10 rounded-lg border border-border bg-[#0a0e14] px-3 text-sm"
          >
            <option value="">All marks</option>
            {LEGAL_MARKS.map((m) => (
              <option key={m} value={m}>
                Mark {m}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EnergyType | "")}
            className="h-10 rounded-lg border border-border bg-[#0a0e14] px-3 text-sm md:col-span-2"
          >
            {ENERGY_TYPES.map((t) => (
              <option key={t || "all-types"} value={t}>
                {t || "All energy types"}
              </option>
            ))}
          </select>
        </div>

        {searching ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
            {results.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                No cards match those filters.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Start typing or pick a filter to search the legal pool. Or browse expansions below.
          </p>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4">
          <h2 className="font-heading text-xl font-semibold">Legal expansions</h2>
          <p className="text-sm text-muted-foreground">
            Sets with cards currently legal in {FORMAT_NAME}.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-semibold">Recent staples</h2>
            <p className="text-sm text-muted-foreground">
              Scripted engines, attackers, and ACE SPECs worth knowing cold.
            </p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {staples.map((card) => (
            <CardTile key={card.id} card={card} className="min-w-[220px] max-w-[240px]" compact />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
