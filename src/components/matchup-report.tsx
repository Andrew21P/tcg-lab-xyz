import { CaveatBanner } from "@/components/caveat-banner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MatchupResult = {
  g1WinRate: number;
  g2WinRate: number;
  bo3Estimate: number;
  whoWantsG1?: string;
  commonLosingLines?: string[];
  techMoves?: { name: string; note: string; rate?: number }[];
  caveat?: string;
  games?: number;
};

function Bar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "violet" | "amber";
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const fill =
    tone === "cyan"
      ? "bg-cyan-400"
      : tone === "violet"
        ? "bg-violet-400"
        : "bg-amber-400";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-foreground">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MatchupReport({
  result,
  titleA = "List A",
  titleB = "List B",
  className,
}: {
  result: MatchupResult;
  titleA?: string;
  titleB?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <CaveatBanner />
      <div className="lab-panel space-y-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg font-semibold">Matchup report</h3>
            <p className="text-sm text-muted-foreground">
              {titleA} vs {titleB}
              {result.games != null ? ` · ${result.games} games` : ""}
            </p>
          </div>
          <Badge tone="violet">Engine + agent</Badge>
        </div>

        <div className="space-y-4">
          <Bar label="Game 1 win rate (you on play)" value={result.g1WinRate} tone="cyan" />
          <Bar label="Game 2 win rate (you on draw)" value={result.g2WinRate} tone="violet" />
          <Bar label="Best-of-3 estimate" value={result.bo3Estimate} tone="amber" />
        </div>

        {result.whoWantsG1 && (
          <div className="rounded-xl border border-border/80 bg-[#0a0e14]/70 p-3 text-sm">
            <span className="text-muted-foreground">Who wants G1: </span>
            <span className="font-medium text-amber-300">{result.whoWantsG1}</span>
          </div>
        )}

        {result.commonLosingLines && result.commonLosingLines.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Common losing lines</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {result.commonLosingLines.map((line) => (
                <li key={line} className="rounded-lg border border-border/60 px-3 py-2">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.techMoves && result.techMoves.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Tech moves (≥3% signal)</h4>
            <div className="space-y-2">
              {result.techMoves.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col gap-1 rounded-lg border border-violet-400/25 bg-violet-400/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium text-violet-200">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.note}</div>
                  </div>
                  {t.rate != null && (
                    <Badge tone="violet">{(t.rate * 100).toFixed(1)}%</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
