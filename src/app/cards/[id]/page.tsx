import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCards,
  getCardById,
  ROLE_LABELS,
  getRoleColor,
} from "@/lib/cards";
import { FORMAT_NAME, ROTATION, isCardStandardLegal } from "@/lib/format";
import { TOP8 } from "@/lib/archetypes";
import { weeksUntil } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { CardArt } from "@/components/card-tile";

export function generateStaticParams() {
  return getAllCards().slice(0, 200).map((c) => ({ id: c.id }));
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getCardById(decodeURIComponent(id));
  if (!card) notFound();

  const legal = isCardStandardLegal({
    regulationMark: card.regulationMark,
    legalities: card.legalities,
    id: card.id,
  });
  const weeks = weeksUntil(ROTATION.nextRotation);
  const inclusion = TOP8.filter((a) =>
    Object.keys(a.inclusionRates).some(
      (name) => name.toLowerCase() === card.name.toLowerCase(),
    ),
  ).map((a) => ({
    archetype: a,
    rate: a.inclusionRates[
      Object.keys(a.inclusionRates).find(
        (n) => n.toLowerCase() === card.name.toLowerCase(),
      )!
    ],
  }));

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-cyan-300">
          Card Lab
        </Link>
        <span>/</span>
        <Link href={`/sets/${card.setCode}`} className="hover:text-cyan-300">
          {card.setCode}
        </Link>
        <span>/</span>
        <span className="text-foreground">{card.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr_280px]">
        <div className="lab-panel p-3">
          <CardArt card={card} large />
        </div>
        <div className="space-y-6">
          <div className="lab-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mark-badge">{card.regulationMark}</span>
                  <Badge tone="cyan">{card.supertype}</Badge>
                  {card.scripted && <Badge tone="violet">Scripted</Badge>}
                  {card.subtypes.map((s) => (
                    <span key={s} className="lab-chip">
                      {s}
                    </span>
                  ))}
                </div>
                <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
                  {card.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {card.setName} · {card.setCode} #{card.number}
                  {card.hp ? ` · ${card.hp} HP` : ""}
                  {card.types?.length ? ` · ${card.types.join("/")}` : ""}
                </p>
              </div>
            </div>

            {card.abilities && card.abilities.length > 0 && (
              <div className="mt-6 space-y-3">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-violet-300">
                  Abilities
                </h2>
                {card.abilities.map((ab) => (
                  <div
                    key={ab.name}
                    className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-3"
                  >
                    <div className="text-sm font-semibold">
                      {ab.type}: {ab.name}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{ab.text}</p>
                  </div>
                ))}
              </div>
            )}

            {card.attacks && card.attacks.length > 0 && (
              <div className="mt-6 space-y-3">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-cyan-300">
                  Attacks
                </h2>
                {card.attacks.map((atk) => (
                  <div
                    key={atk.name}
                    className="rounded-xl border border-border/80 bg-[#0a0e14]/70 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold">{atk.name}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-muted-foreground">
                          {atk.cost.join(" · ") || "—"}
                        </span>
                        {atk.damage && (
                          <span className="font-mono text-amber-300">{atk.damage}</span>
                        )}
                        {atk.prizes && (
                          <Badge tone="amber">{atk.prizes} prize</Badge>
                        )}
                      </div>
                    </div>
                    {atk.text && (
                      <p className="mt-2 text-sm text-muted-foreground">{atk.text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {card.rules && card.rules.length > 0 && (
              <div className="mt-6 space-y-2">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-amber-300">
                  Rules
                </h2>
                {card.rules.map((r) => (
                  <p key={r} className="text-sm text-muted-foreground">
                    {r}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="lab-panel p-4">
              <h3 className="font-heading text-sm font-semibold text-cyan-300">
                When good
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.whenGood ?? "No annotation yet — treat as context-dependent."}
              </p>
            </div>
            <div className="lab-panel p-4">
              <h3 className="font-heading text-sm font-semibold text-amber-300">
                When brick
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.whenBrick ?? "No annotation yet — watch for dead-draw spots."}
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="lab-panel overflow-hidden p-3">
            <CardArt
              card={card}
              large
              className="mx-auto w-full max-w-[280px] rounded-xl shadow-[0_0_32px_rgba(61,214,195,0.12)]"
            />
          </div>

          <div className="lab-panel p-4">
            <h3 className="font-heading text-sm font-semibold">Roles</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(card.roles ?? []).length === 0 && (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
              {card.roles?.map((role) => (
                <span
                  key={role}
                  className="lab-chip"
                  style={{
                    borderColor: `${getRoleColor(role)}66`,
                    color: getRoleColor(role),
                  }}
                >
                  {ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          </div>

          <div className="lab-panel p-4">
            <h3 className="font-heading text-sm font-semibold">Legality clock</h3>
            <p className="mt-2 text-sm">
              <Badge tone={legal ? "cyan" : "danger"}>
                {legal ? `Legal · ${FORMAT_NAME}` : "Not Standard legal"}
              </Badge>
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Live rotation {ROTATION.liveEffective} · paper {ROTATION.paperEffective}.
              {weeks == null
                ? " Next rotation unknown — legal this season."
                : ` ~${weeks} weeks until next rotation date.`}
            </p>
          </div>

          <div className="lab-panel p-4">
            <h3 className="font-heading text-sm font-semibold">Archetype inclusion</h3>
            {inclusion.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Not tracked in TOP8 inclusion tables.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {inclusion.map(({ archetype, rate }) => (
                  <li
                    key={archetype.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>{archetype.name}</span>
                    <span className="font-mono text-cyan-300">
                      {(rate * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lab-panel space-y-2 p-4 text-xs text-muted-foreground">
            {card.weaknesses && (
              <div>
                Weakness:{" "}
                {card.weaknesses.map((w) => `${w.type} ${w.value}`).join(", ")}
              </div>
            )}
            {card.resistances && (
              <div>
                Resistance:{" "}
                {card.resistances.map((r) => `${r.type} ${r.value}`).join(", ")}
              </div>
            )}
            {card.retreat != null && <div>Retreat: {card.retreat}</div>}
            {card.rarity && <div>Rarity: {card.rarity}</div>}
            {card.artist && <div>Artist: {card.artist}</div>}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
