"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TOP8 } from "@/lib/archetypes";
import { META_SNAPSHOT, getFieldShareDeltas } from "@/lib/meta/snapshot";
import { getMetaInsights, computeFieldEv } from "@/lib/meta/field-ev";
import { resolveCardName } from "@/lib/cards";
import { CardArt } from "@/components/card-tile";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CaveatBanner } from "@/components/caveat-banner";

function listText(id: string): string {
  const a = TOP8.find((x) => x.id === id);
  if (!a) return "";
  return a.consensusList
    .map((e) =>
      e.setCode && e.number
        ? `${e.count} ${e.name} ${e.setCode} ${e.number}`
        : `${e.count} ${e.name}`,
    )
    .join("\n");
}

export default function MetaPage() {
  const insights = useMemo(() => {
    try {
      return getMetaInsights();
    } catch {
      return {
        risingCards: META_SNAPSHOT.risingCards,
        techsAfterEvent: META_SNAPSHOT.techsAfterEvent,
        sourceNote: META_SNAPSHOT.sourceNote,
      };
    }
  }, []);

  const deltas = useMemo(() => getFieldShareDeltas(META_SNAPSHOT), []);
  const [dragapultRoom, setDragapultRoom] = useState(40);
  const [matchupVsDraga, setMatchupVsDraga] = useState(0.42);
  const [festivalEv, setFestivalEv] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>("dragapult-ex");

  function runFieldEv() {
    const share = { ...META_SNAPSHOT.fieldShare, "dragapult-ex": dragapultRoom };
    const myMatchups: Record<string, number> = {};
    for (const id of Object.keys(share)) {
      myMatchups[id] = id.startsWith("dragapult") ? matchupVsDraga : 0.52;
    }
    myMatchups["festival-lead"] = 0.5;
    const ev = computeFieldEv({ myMatchups, fieldShare: share });
    setFestivalEv(ev.expectedWinRate);
  }

  const rising = insights.risingCards ?? META_SNAPSHOT.risingCards;
  const techs = insights.techsAfterEvent ?? META_SNAPSHOT.techsAfterEvent;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Meta Lab"
        title="Published lists + field questions"
        description="Not a usage dump. Import consensus 60s, see what rose after events, and ask: if the room is 40% Dragapult, what is Festival’s EV?"
        actions={<Badge tone="cyan">{META_SNAPSHOT.date}</Badge>}
      />

      <CaveatBanner className="mb-6" />

      <p className="mb-8 text-xs text-muted-foreground">
        Source: {insights.sourceNote ?? META_SNAPSHOT.sourceNote}. Limitless remains
        data of record — these are vendored study lists for localhost.
      </p>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Published consensus lists
            </h2>
            <p className="text-sm text-muted-foreground">
              TOP8 archetypes with field share and an openable list for List Lab /
              Matchup.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {TOP8.map((arch) => {
            const share = META_SNAPSHOT.fieldShare[arch.id] ?? 0;
            const delta = deltas[arch.id];
            const open = expanded === arch.id;
            const keyCard = resolveCardName(arch.keyCardNames[0] ?? "");
            const total = arch.consensusList.reduce((s, e) => s + e.count, 0);

            return (
              <div key={arch.id} className="lab-panel overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-start gap-4 p-4 text-left hover:bg-white/[0.02]"
                  onClick={() => setExpanded(open ? null : arch.id)}
                >
                  <div className="hidden w-16 shrink-0 sm:block">
                    {keyCard ? (
                      <CardArt card={keyCard} className="rounded-md" />
                    ) : (
                      <div className="card-art" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg font-semibold">
                        {arch.name}
                      </h3>
                      <Badge tone="cyan">{share.toFixed(1)}% field</Badge>
                      {delta != null && (
                        <Badge tone={delta >= 0 ? "violet" : "amber"}>
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(1)} pts
                        </Badge>
                      )}
                      <span className="lab-chip">{arch.playbook}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {arch.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Consensus stack · {total} cards listed · keys:{" "}
                      {arch.keyCardNames.slice(0, 4).join(", ")}
                    </p>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border px-4 py-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Link href={`/list?archetype=${arch.id}`}>
                        <Button type="button" size="sm">
                          Open in List Lab
                        </Button>
                      </Link>
                      <Link href={`/matchup`}>
                        <Button type="button" size="sm" variant="secondary">
                          Run matchup
                        </Button>
                      </Link>
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-xl bg-[#0c1018] p-4 font-mono text-xs leading-relaxed text-teal-100/90">
                      {listText(arch.id)}
                    </pre>
                    {arch.techOptions.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Tech options: {arch.techOptions.join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="lab-panel p-4">
          <h2 className="font-heading text-lg font-semibold">Rising cards</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Movers in winning lists — test before the next event.
          </p>
          <ul className="mt-4 space-y-3">
            {rising.map((card: { name: string; note: string; deltaSharePts?: number }) => (
              <li
                key={card.name}
                className="rounded-xl border border-teal-400/20 bg-teal-400/5 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-teal-100">{card.name}</span>
                  {card.deltaSharePts != null && (
                    <Badge tone="cyan">+{card.deltaSharePts.toFixed(1)} pts</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="lab-panel p-4">
          <h2 className="font-heading text-lg font-semibold">Techs after event</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cards that spiked after a named Regional / International.
          </p>
          <ul className="mt-4 space-y-3">
            {techs.map(
              (t: { name: string; note: string; archetypeIds: string[] }) => (
                <li
                  key={t.name}
                  className="rounded-xl border border-indigo-400/20 bg-indigo-400/5 px-3 py-2.5"
                >
                  <div className="font-medium text-indigo-100">{t.name}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.note}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t.archetypeIds.join(" · ")}
                  </p>
                </li>
              ),
            )}
          </ul>
        </section>
      </div>

      <section className="lab-panel p-5">
        <h2 className="font-heading text-lg font-semibold">
          Field EV — “if the room is X% Dragapult…”
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approximate Festival’s expected win rate if Dragapult’s share changes and
          your matchup vs those shells is fixed.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              Dragapult room %
            </span>
            <Input
              type="number"
              className="w-28"
              value={dragapultRoom}
              onChange={(e) => setDragapultRoom(Number(e.target.value) || 0)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              Your WR vs Dragapult
            </span>
            <Input
              type="number"
              step="0.01"
              className="w-28"
              value={matchupVsDraga}
              onChange={(e) => setMatchupVsDraga(Number(e.target.value) || 0)}
            />
          </label>
          <Button type="button" onClick={runFieldEv}>
            Compute Festival EV
          </Button>
        </div>
        {festivalEv != null && (
          <p className="mt-4 text-lg font-semibold text-teal-200">
            Expected win rate ≈ {(festivalEv * 100).toFixed(1)}%
          </p>
        )}
      </section>
    </PageShell>
  );
}
