"use client";

import { useMemo, useState } from "react";
import { LESSONS, type Lesson } from "@/lib/school";
import { SchoolLesson } from "@/components/school-lesson";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SchoolPage() {
  const lessons = useMemo(() => {
    try {
      return LESSONS as Lesson[];
    } catch {
      return [] as Lesson[];
    }
  }, []);
  const [activeId, setActiveId] = useState<string | null>(lessons[0]?.id ?? null);
  const active = lessons.find((l) => l.id === activeId) ?? null;

  return (
    <PageShell>
      <PageHeader
        eyebrow="School"
        title="Pokémon TCG fundamentals"
        description="Eight lessons on prize math, Supporters, Energy, gusts, Dragapult sequencing, Bo3 concessions, and mulligans. Pick a topic, study the board, then check the line."
        actions={<Badge tone="violet">{lessons.length} lessons</Badge>}
      />

      {lessons.length === 0 ? (
        <div className="lab-panel p-6 text-sm text-muted-foreground">
          Lessons data failed to load. Check `data/school/lessons.ts`.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lab-panel space-y-1 p-3">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Curriculum
            </div>
            {lessons.map((lesson, index) => (
              <Button
                key={lesson.id}
                type="button"
                variant={activeId === lesson.id ? "default" : "ghost"}
                className="h-auto w-full justify-start px-3 py-2.5 text-left"
                onClick={() => setActiveId(lesson.id)}
              >
                <span className="block w-full">
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] text-[#3dd6c3]/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="block text-sm font-semibold leading-snug">
                      {lesson.title}
                    </span>
                  </span>
                  <span className="mt-1 block pl-6 text-[11px] font-normal leading-snug text-muted-foreground normal-case tracking-normal">
                    {lesson.summary}
                  </span>
                </span>
              </Button>
            ))}
          </aside>
          {active ? <SchoolLesson key={active.id} lesson={active} /> : null}
        </div>
      )}
    </PageShell>
  );
}
