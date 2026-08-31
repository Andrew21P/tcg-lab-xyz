import { Badge } from "@/components/ui/badge";
import { CaveatBanner } from "@/components/caveat-banner";
import { cn } from "@/lib/utils";

export type PrizeMapResult = {
  prizesThisAttack: number;
  attachmentsUntilLethal: number;
  comebackRisk?: string;
  notes?: string[];
  attackName?: string;
  damage?: string | number;
  damageDealt?: number;
  defenderHpRemaining?: number;
  isKo?: boolean;
};

export function PrizeMapPanel({
  attackerName,
  defenderName,
  result,
  className,
}: {
  attackerName: string;
  defenderName: string;
  result: PrizeMapResult;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <CaveatBanner />
      <div className="lab-panel space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg font-semibold">Prize map</h3>
            <p className="text-sm text-muted-foreground">
              {attackerName} → {defenderName}
            </p>
          </div>
          <Badge tone="amber">Prize tempo</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
            <div className="text-[11px] uppercase tracking-wide text-amber-200/80">
              Prizes this attack
            </div>
            <div className="mt-1 font-heading text-3xl font-bold text-amber-300">
              {result.prizesThisAttack}
            </div>
          </div>
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4">
            <div className="text-[11px] uppercase tracking-wide text-cyan-200/80">
              Attachments to lethal
            </div>
            <div className="mt-1 font-heading text-3xl font-bold text-cyan-300">
              {result.attachmentsUntilLethal}
            </div>
          </div>
          <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-4">
            <div className="text-[11px] uppercase tracking-wide text-violet-200/80">
              Attack
            </div>
            <div className="mt-1 font-heading text-lg font-semibold text-violet-200">
              {result.attackName ?? "Best lethal line"}
            </div>
            {result.damage != null && (
              <div className="mt-1 font-mono text-sm text-muted-foreground">
                {result.damage} dmg
              </div>
            )}
            {result.damageDealt != null && result.damage == null && (
              <div className="mt-1 font-mono text-sm text-muted-foreground">
                {result.damageDealt} dmg
              </div>
            )}
          </div>
        </div>

        {result.comebackRisk && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
            <span className="font-semibold">Comeback risk: </span>
            {result.comebackRisk}
          </div>
        )}

        {result.notes && result.notes.length > 0 && (
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {result.notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="lab-panel space-y-2 p-4 text-sm text-muted-foreground">
        <h4 className="font-heading text-base font-semibold text-foreground">
          Prize tempo primer
        </h4>
        <p>
          Taking a 1-prize KO when you could set up a 2-prize swing often feeds draw engines
          (Fezandipiti) or damage movers (Dusknoir / Munkidori). Count prizes remaining{" "}
          <em>and</em> what the opponent unlocks before you click attack.
        </p>
        <p>
          Attachments until lethal is the tempo clock: every wasted energy attach is a turn
          your opponent gets to gust, disrupt, or race the same prize math.
        </p>
      </div>
    </div>
  );
}
