"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Loose board shapes — match @/lib/engine/state once available. */
export type BoardPokemon = {
  cardId?: string;
  cardName: string;
  hp?: number;
  maxHp: number;
  damage: number;
  energy?: string[];
  tool?: string;
  conditions?: {
    asleep?: boolean;
    confused?: boolean;
    paralyzed?: boolean;
    poisoned?: boolean;
    burned?: boolean;
  };
};

export type BoardCardRef = {
  instanceId: string;
  cardId?: string;
  name: string;
  faceUp?: boolean;
};

export type BoardPlayer = {
  active: BoardPokemon | null;
  bench: (BoardPokemon | null)[];
  hand: BoardCardRef[];
  deck: BoardCardRef[];
  discard: BoardCardRef[];
  prizes: BoardCardRef[];
  prizeCount?: number;
};

export type BoardGameState = {
  players: [BoardPlayer, BoardPlayer] | BoardPlayer[];
  turn: number;
  activePlayer: number;
  phase: string;
  stadium?: string | null;
  winner?: number | null;
};

export type BoardAction = {
  type: string;
  cardName?: string;
  attackName?: string;
  targetName?: string;
  [key: string]: unknown;
};

function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

function PokemonSlot({
  mon,
  label,
}: {
  mon: BoardPokemon | null | undefined;
  label?: string;
}) {
  if (!mon) {
    return (
      <div className="zone-slot flex items-center justify-center p-2 text-xs text-muted-foreground/60">
        {label ?? "Empty"}
      </div>
    );
  }
  const hpLeft = Math.max(0, mon.maxHp - mon.damage);
  return (
    <div className="zone-slot flex flex-col justify-between p-2">
      <div className="truncate text-xs font-semibold text-foreground">{mon.cardName}</div>
      <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
        <span className="text-cyan-300">
          {hpLeft}/{mon.maxHp}
        </span>
        <span className="text-amber-300">{mon.energy?.length ?? 0}E</span>
      </div>
      {(mon.conditions?.asleep ||
        mon.conditions?.confused ||
        mon.conditions?.paralyzed ||
        mon.conditions?.poisoned ||
        mon.conditions?.burned) && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {mon.conditions.asleep && <Badge tone="violet">SLP</Badge>}
          {mon.conditions.confused && <Badge tone="amber">CNF</Badge>}
          {mon.conditions.paralyzed && <Badge tone="danger">PAR</Badge>}
          {mon.conditions.poisoned && <Badge tone="violet">PSN</Badge>}
          {mon.conditions.burned && <Badge tone="danger">BRN</Badge>}
        </div>
      )}
    </div>
  );
}

function PlayerBoard({
  state,
  playerIndex,
  side,
}: {
  state: BoardGameState;
  playerIndex: 0 | 1;
  side: "you" | "opp";
}) {
  const p = state.players[playerIndex];
  const bench = [...(p?.bench ?? [])];
  while (bench.length < 5) bench.push(null);

  return (
    <div
      className={cn(
        "lab-panel space-y-3 p-3",
        side === "you" ? "border-cyan-400/25" : "border-violet-400/25",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold">
          {side === "you" ? "You" : "Opponent"} · P{playerIndex + 1}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <span className="lab-chip">Prizes {p?.prizeCount ?? p?.prizes?.length ?? 0}</span>
          <span className="lab-chip">Hand {p?.hand?.length ?? 0}</span>
          <span className="lab-chip">Deck {p?.deck?.length ?? 0}</span>
          <span className="lab-chip">Discard {p?.discard?.length ?? 0}</span>
        </div>
      </div>

      <div>
        <ZoneLabel>Active</ZoneLabel>
        <PokemonSlot mon={p?.active} label="No Active" />
      </div>

      <div>
        <ZoneLabel>Bench</ZoneLabel>
        <div className="grid grid-cols-5 gap-1.5">
          {bench.slice(0, 5).map((mon, i) => (
            <PokemonSlot key={i} mon={mon} label={`B${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-dashed border-border/80 bg-[#0a0e14]/50 p-2">
          <ZoneLabel>Hand</ZoneLabel>
          <div className="max-h-16 space-y-0.5 overflow-y-auto">
            {(p?.hand ?? []).slice(0, 8).map((c) => (
              <div key={c.instanceId} className="truncate text-muted-foreground">
                {c.name}
              </div>
            ))}
            {(p?.hand?.length ?? 0) > 8 && (
              <div className="text-muted-foreground/70">+{(p?.hand?.length ?? 0) - 8} more</div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-border/80 bg-[#0a0e14]/50 p-2">
          <ZoneLabel>Prizes</ZoneLabel>
          <div className="font-mono text-amber-300">
            {(p?.prizes ?? []).map((pr, i) => (
              <span key={pr.instanceId ?? i} className="mr-1">
                {pr.faceUp ? "◆" : "◇"}
              </span>
            ))}
            {(p?.prizes?.length ?? 0) === 0 && "—"}
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-border/80 bg-[#0a0e14]/50 p-2">
          <ZoneLabel>Discard top</ZoneLabel>
          <div className="truncate text-muted-foreground">
            {p?.discard?.[p.discard.length - 1]?.name ?? "Empty"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BoardView({
  state,
  legalActions = [],
  onAction,
  className,
}: {
  state: BoardGameState;
  legalActions?: BoardAction[];
  onAction?: (action: BoardAction) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge tone="cyan">Turn {state.turn}</Badge>
        <Badge tone="violet">Phase {state.phase}</Badge>
        <Badge tone="amber">Active P{(state.activePlayer ?? 0) + 1}</Badge>
        {state.stadium && (
          <span className="lab-chip">
            Stadium:{" "}
            {typeof state.stadium === "string"
              ? state.stadium
              : (state.stadium as { name?: string }).name ?? "Active"}
          </span>
        )}
        {state.winner != null && (
          <Badge tone="danger">Winner P{state.winner + 1}</Badge>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PlayerBoard state={state} playerIndex={1} side="opp" />
        <PlayerBoard state={state} playerIndex={0} side="you" />
      </div>

      {onAction && (
        <div className="lab-panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-semibold">Legal actions</h3>
            <span className="lab-chip">{legalActions.length} available</span>
          </div>
          {legalActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No legal actions right now.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {legalActions.map((action, i) => (
                <Button
                  key={`${action.type}-${i}`}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onAction(action)}
                >
                  {formatAction(action)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatAction(action: BoardAction): string {
  const bits = [action.type];
  if (action.cardName) bits.push(action.cardName);
  if (action.attackName) bits.push(action.attackName);
  if (action.targetName) bits.push(`→ ${action.targetName}`);
  return bits.join(" · ");
}
