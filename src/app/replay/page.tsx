"use client";

import { useState } from "react";
import { parseReplay, type ParseReplayResult } from "@/lib/replay/parse";
import { ReplayViewer } from "@/components/replay-viewer";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReplayPage() {
  const [text, setText] = useState("");
  const [replay, setReplay] = useState<ParseReplayResult | null>(null);
  const [message, setMessage] = useState("");

  function handleParse() {
    try {
      const parsed = parseReplay(text);
      setReplay(parsed);
      setMessage(
        parsed.errors?.length
          ? `Parsed with ${parsed.errors.length} warning(s).`
          : `Parsed ${parsed.events.length} events / ${parsed.frames.length} frames.`,
      );
    } catch (err) {
      console.error(err);
      setMessage("parseReplay failed.");
      setReplay(null);
    }
  }

  async function loadSample() {
    try {
      const mod = await import("@/lib/replay/sample");
      const sample =
        typeof mod.sampleReplay === "string"
          ? mod.sampleReplay
          : typeof mod.loadSampleReplay === "function"
            ? mod.loadSampleReplay()
            : typeof mod.SAMPLE_REPLAY_DRAGAPULT === "string"
              ? mod.SAMPLE_REPLAY_DRAGAPULT
              : "";
      if (sample) {
        setText(sample);
        const parsed = parseReplay(sample);
        setReplay(parsed);
        setMessage("Loaded sample Dragapult log.");
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setMessage("Sample module not ready — paste a PTCGL English log.");
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Replay Lab"
        title="Scrub the log"
        description="Paste an English PTCGL battle log, scrub frames, then Fork a position into Board Lab via sessionStorage."
        actions={<Badge tone="violet">Fork → /board?fork=1</Badge>}
      />

      <div className="lab-panel space-y-3 p-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[220px]"
          placeholder="Paste PTCGL English battle log…"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleParse}>
            Parse log
          </Button>
          <Button type="button" variant="secondary" onClick={loadSample}>
            Load sample
          </Button>
        </div>
        {message && <p className="text-sm text-cyan-300">{message}</p>}
      </div>

      {replay && (
        <div className="mt-6">
          <ReplayViewer replay={replay} />
        </div>
      )}
    </PageShell>
  );
}
