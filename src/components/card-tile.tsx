"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TcgCard } from "@/lib/types";
import { ROLE_LABELS, getRoleColor } from "@/lib/cards";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function normalizeArtUrl(raw: string): string {
  return raw.replace(/\/0+(\d+)(_hires)?\.png$/, (_m, n, hi) => `/${n}${hi ?? ""}.png`);
}

function artCandidates(card: TcgCard, large = false): string[] {
  const urls: string[] = [];
  const primary = large ? card.imageLarge : card.imageSmall;
  const secondary = large ? card.imageSmall : card.imageLarge;
  if (primary) urls.push(normalizeArtUrl(primary));
  if (secondary) urls.push(normalizeArtUrl(secondary));

  const setId = card.setId || card.apiId?.split("-")[0];
  const bare = card.number.replace(/^0+/, "") || card.number;
  if (setId) {
    urls.push(
      large
        ? `https://images.pokemontcg.io/${setId}/${bare}_hires.png`
        : `https://images.pokemontcg.io/${setId}/${bare}.png`,
    );
  }

  return [...new Set(urls.filter(Boolean))];
}

export function CardArt({
  card,
  className,
  large,
}: {
  card: TcgCard;
  className?: string;
  large?: boolean;
}) {
  const candidates = useMemo(() => artCandidates(card, large), [card, large]);
  const [idx, setIdx] = useState(0);

  if (idx >= candidates.length) {
    return (
      <div
        className={cn(
          "card-art flex flex-col items-center justify-center gap-1 p-3 text-center",
          className,
        )}
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {card.supertype}
        </span>
        <span className="text-xs font-semibold leading-tight text-foreground/80">
          {card.name}
        </span>
        <span className="mark-badge mt-1">{card.regulationMark || "—"}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidates[idx]}
      alt={card.name}
      className={cn("card-art", className)}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

export function CardTile({
  card,
  className,
  compact,
}: {
  card: TcgCard;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/cards/${encodeURIComponent(card.id)}`}
      className={cn(
        "lab-panel group flex flex-col overflow-hidden transition hover:border-teal-400/40 hover:shadow-[0_0_28px_rgba(46,196,182,0.12)]",
        className,
      )}
    >
      <div className="relative aspect-[63/88] bg-[#0c1018] p-2">
        <CardArt card={card} className="h-full w-full object-contain" />
        <span className="mark-badge absolute right-3 top-3 shadow-lg">
          {card.regulationMark || "—"}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3 pt-2">
        <div className="min-w-0">
          <div className="truncate font-heading text-sm font-semibold text-foreground group-hover:text-teal-200">
            {card.name}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {card.setCode} · #{card.number}
          </div>
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-1">
            <Badge tone="cyan">{card.supertype}</Badge>
            {card.scripted && <Badge tone="violet">Scripted</Badge>}
            {card.roles?.slice(0, 2).map((role) => (
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
        )}
      </div>
    </Link>
  );
}
