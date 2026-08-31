import { notFound } from "next/navigation";
import { getCardsBySet, getLegalSets } from "@/lib/cards";
import { CardTile } from "@/components/card-tile";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return getLegalSets().map((s) => ({ code: s.code }));
}

export default async function SetPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const set = getLegalSets().find(
    (s) => s.code.toUpperCase() === code.toUpperCase(),
  );
  if (!set) notFound();

  const cards = getCardsBySet(set.code);

  return (
    <PageShell>
      <PageHeader
        eyebrow={set.series}
        title={set.name}
        description={`${cards.length} legal cards · released ${set.releaseDate}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <span className="lab-chip font-mono">{set.code}</span>
            {set.marks.map((m) => (
              <span key={m} className="mark-badge">
                {m}
              </span>
            ))}
            <Badge tone="amber">{set.legalCardCount} catalogued</Badge>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </PageShell>
  );
}
