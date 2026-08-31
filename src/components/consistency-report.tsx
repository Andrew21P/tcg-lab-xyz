import { CaveatBanner } from "@/components/caveat-banner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConsistencyMetrics = {
  mulliganRate: number;
  attackTurn1Rate: number;
  attackTurn2Rate: number;
  energyFloodRate: number;
  energyStarveRate: number;
  openingHandBasicsAvg: number;
  prizeLock?: {
    candy?: number;
    boss?: number;
    aceSpec?: number;
    [key: string]: number | undefined;
  };
};

export type SwapSuggestion = {
  cut: string;
  add: string;
  deltaEv: number;
  note: string;
};

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function ConsistencyReport({
  report,
  swaps = [],
  className,
}: {
  report: ConsistencyMetrics;
  swaps?: SwapSuggestion[];
  className?: string;
}) {
  const metrics = [
    { label: "Mulligan rate", value: pct(report.mulliganRate), hint: "No Basic in opening 7" },
    { label: "Attack T1", value: pct(report.attackTurn1Rate), hint: "Can attack turn 1" },
    { label: "Attack T2", value: pct(report.attackTurn2Rate), hint: "Can attack turn 2" },
    { label: "Energy flood", value: pct(report.energyFloodRate), hint: "Too many energy early" },
    { label: "Energy starve", value: pct(report.energyStarveRate), hint: "Can't attach when needed" },
    {
      label: "Opening Basics",
      value: report.openingHandBasicsAvg.toFixed(2),
      hint: "Avg Basics in opening hand",
    },
  ];

  const locks = Object.entries(report.prizeLock ?? {}).filter(
    ([, v]) => typeof v === "number",
  ) as [string, number][];

  return (
    <div className={cn("space-y-4", className)}>
      <CaveatBanner />
      <div className="lab-panel p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold">Consistency</h3>
          <Badge tone="violet">Monte Carlo</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-border/80 bg-[#0a0e14]/70 p-3"
            >
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {m.label}
              </div>
              <div className="mt-1 font-heading text-2xl font-bold text-cyan-300">
                {m.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {locks.length > 0 && (
        <div className="lab-panel p-4">
          <h3 className="mb-3 font-heading text-lg font-semibold">Prize lock</h3>
          <div className="flex flex-wrap gap-2">
            {locks.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2"
              >
                <div className="text-[10px] uppercase tracking-wide text-amber-200/80">
                  {key}
                </div>
                <div className="font-mono text-lg font-bold text-amber-300">
                  {pct(value)}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Probability key pieces sit in prizes at game start (hypergeometric + trials).
          </p>
        </div>
      )}

      {swaps.length > 0 && (
        <div className="lab-panel p-4">
          <h3 className="mb-3 font-heading text-lg font-semibold">Swap suggestions</h3>
          <div className="space-y-2">
            {swaps.map((s) => (
              <div
                key={`${s.cut}-${s.add}`}
                className="flex flex-col gap-1 rounded-xl border border-border/80 bg-[#0a0e14]/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <span className="text-red-300">−{s.cut}</span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="text-cyan-300">+{s.add}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
                </div>
                <Badge tone={s.deltaEv >= 0 ? "cyan" : "danger"}>
                  {s.deltaEv >= 0 ? "+" : ""}
                  {(s.deltaEv * 100).toFixed(1)} pts EV
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
