import Link from "next/link";
import type { TcgSet } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SetCard({
  set,
  className,
}: {
  set: TcgSet;
  className?: string;
}) {
  return (
    <Link
      href={`/sets/${encodeURIComponent(set.code)}`}
      className={cn(
        "lab-panel group relative overflow-hidden p-4 transition hover:border-violet-400/40",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-violet-500/10 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.16em] text-cyan-300/80">
            {set.code}
          </div>
          <h3 className="mt-1 font-heading text-base font-semibold text-foreground group-hover:text-violet-200">
            {set.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{set.series}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-300">{set.legalCardCount}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            legal
          </div>
        </div>
      </div>
      <div className="relative mt-3 flex flex-wrap gap-1">
        {set.marks.map((m) => (
          <span key={m} className="mark-badge">
            {m}
          </span>
        ))}
      </div>
      <div className="relative mt-3 text-[11px] text-muted-foreground">
        Released {set.releaseDate}
      </div>
    </Link>
  );
}
