"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  forkFrame,
  type ParseReplayResult,
  type ReplayEvent,
  type ReplayFrame,
} from "@/lib/replay/parse";
import { cn } from "@/lib/utils";

export type { ParseReplayResult as ParsedReplay, ReplayEvent, ReplayFrame };

export function ReplayViewer({
  replay,
  className,
}: {
  replay: ParseReplayResult;
  className?: string;
}) {
  const router = useRouter();
  const frames = replay.frames ?? [];
  const [index, setIndex] = useState(0);
  const frame = frames[index] ?? null;

  const eventsUpTo = useMemo(() => {
    if (!frame) return replay.events;
    return replay.events.slice(0, frame.eventsThrough);
  }, [frame, replay.events]);

  function handleFork() {
    if (!frame) return;
    try {
      const forked = forkFrame(frame);
      sessionStorage.setItem("tcglab:fork", JSON.stringify(forked));
      router.push("/board?fork=1");
    } catch (err) {
      console.error(err);
      alert("Could not fork this frame into Board Lab.");
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="lab-panel space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">Replay scrubber</h3>
            <p className="text-sm text-muted-foreground">
              {(replay.players ?? ["P1", "P2"]).join(" vs ")} · {frames.length} frames ·{" "}
              {replay.events.length} events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="cyan">
              Frame {frames.length ? index + 1 : 0}/{frames.length}
            </Badge>
            <Button type="button" variant="secondary" onClick={handleFork} disabled={!frame}>
              Fork to Board
            </Button>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full accent-cyan-400"
          disabled={frames.length === 0}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index <= 0}
          >
            Prev
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIndex((i) => Math.min(frames.length - 1, i + 1))}
            disabled={index >= frames.length - 1}
          >
            Next
          </Button>
          {frame && <span className="lab-chip">Turn {frame.turn}</span>}
          {frame?.activePlayerName && (
            <span className="text-sm text-muted-foreground">{frame.activePlayerName}</span>
          )}
          {frame?.lastEvent && (
            <span className="text-sm text-muted-foreground truncate max-w-md">
              {frame.lastEvent.raw}
            </span>
          )}
        </div>

        {frame && (
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            {frame.zones.map((z, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/70 bg-[#0a0e14]/60 px-3 py-2"
              >
                <div className="mb-1 font-semibold text-muted-foreground">
                  {replay.players[i] ?? `P${i + 1}`}
                </div>
                Hand {z.hand} · Deck {z.deck} · Discard {z.discard} · Prizes {z.prizes} · Bench{" "}
                {z.bench}
                {z.active ? " · Active" : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lab-panel p-4">
        <h4 className="mb-3 font-heading text-sm font-semibold">Event log</h4>
        <div className="max-h-[420px] space-y-1 overflow-y-auto font-mono text-xs">
          {eventsUpTo.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events parsed.</p>
          ) : (
            eventsUpTo.map((ev, i) => (
              <div
                key={`${ev.line}-${i}`}
                className={cn(
                  "rounded-md px-2 py-1.5",
                  i === eventsUpTo.length - 1
                    ? "bg-cyan-400/10 text-cyan-100"
                    : "text-muted-foreground",
                )}
              >
                <span className="mr-2 text-amber-300/80">{ev.type}</span>
                {ev.raw}
              </div>
            ))
          )}
        </div>
        {replay.errors && replay.errors.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-amber-300">
            {replay.errors.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
