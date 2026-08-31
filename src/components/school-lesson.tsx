"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/school";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function BoardViz({ lesson }: { lesson: Lesson }) {
  const you = lesson.boardSetup.players?.[0];
  const opp = lesson.boardSetup.players?.[1];
  const turn = lesson.boardSetup.turn;
  const phase = lesson.boardSetup.phase;
  const hand = you?.hand ?? [];

  return (
    <div className="rounded-xl border border-[rgba(61,214,195,0.22)] bg-[#0a0e14]/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#3dd6c3]">
          Board visualization
        </h3>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {turn != null && <span className="lab-chip">Turn {turn}</span>}
          {phase && <span className="lab-chip">{phase}</span>}
          {lesson.boardSetup.firstPlayer != null && (
            <span className="lab-chip">
              First: P{lesson.boardSetup.firstPlayer}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3">
          <div className="text-[11px] uppercase tracking-wide text-amber-200/80">
            You
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-amber-300">
            {you?.prizeCount ?? "—"}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              prizes left
            </span>
          </div>
          <div className="mt-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Hand
            </div>
            {hand.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hand cards shown</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {hand.map((c) => (
                  <li
                    key={c.instanceId}
                    className="rounded-md border border-[rgba(61,214,195,0.25)] bg-[rgba(61,214,195,0.08)] px-2 py-1 text-xs text-[#7ee8d8]"
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Opponent
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-foreground">
            {opp?.prizeCount ?? "—"}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              prizes left
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Compare prize counts before choosing gusts, Supporters, or concessions.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SchoolLesson({
  lesson,
  className,
}: {
  lesson: Lesson;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState(false);

  return (
    <div className={cn("lab-panel space-y-5 p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="violet">Lesson</Badge>
          <h2 className="mt-2 font-heading text-2xl font-bold">{lesson.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{lesson.goal}</p>
        </div>
        <span className="lab-chip">{lesson.id}</span>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#3dd6c3]">
          Teaching
        </h3>
        {lesson.body.map((paragraph) => (
          <p
            key={paragraph.slice(0, 48)}
            className="text-sm leading-relaxed text-[#c8d4dc]"
          >
            {paragraph}
          </p>
        ))}
      </section>

      {lesson.tips.length > 0 && (
        <section className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-200">Tips</h3>
          <ul className="space-y-1.5">
            {lesson.tips.map((tip) => (
              <li
                key={tip}
                className="flex gap-2 text-sm text-amber-100/90"
              >
                <span className="text-amber-400">▸</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BoardViz lesson={lesson} />

      <div className="rounded-xl border border-[rgba(61,214,195,0.2)] bg-[rgba(61,214,195,0.05)] p-4">
        <h3 className="mb-2 text-sm font-semibold text-[#7ee8d8]">Goal</h3>
        <p className="text-sm text-muted-foreground">{lesson.goal}</p>
      </div>

      <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-amber-200">Success check</h3>
        <p className="text-sm text-muted-foreground">{lesson.successCheck}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={checked ? "default" : "secondary"}
            onClick={() => setChecked((v) => !v)}
          >
            {checked ? "Marked complete" : "I found the line"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? "Hide notes" : "Reveal teaching notes"}
          </Button>
        </div>
      </div>

      {revealed && (
        <div className="rounded-xl border border-violet-400/25 bg-violet-400/5 p-4 text-sm leading-relaxed text-violet-100/90">
          {lesson.teachingNotes}
        </div>
      )}
    </div>
  );
}
