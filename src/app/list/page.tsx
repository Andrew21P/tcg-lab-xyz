"use client";

import { useEffect, useRef, useState } from "react";
import type { DeckList } from "@/lib/types";
import { DeckEditor, type DeckEditorValue } from "@/components/deck-editor";
import {
  ConsistencyReport,
  type ConsistencyMetrics,
  type SwapSuggestion,
} from "@/components/consistency-report";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { runConsistencyReport } from "@/lib/analysis/consistency";
import { suggestSwaps } from "@/lib/analysis/swaps";
import { saveDeck, loadDecks, encodeShare, decodeShare } from "@/lib/lists/storage";
import { exportToLimitlessText } from "@/lib/lists/export";
import { parseDeckList } from "@/lib/lists/parse";
import { META_SNAPSHOT } from "@/lib/meta/snapshot";
import { getArchetypeById } from "@/lib/archetypes";

function readQueryParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

function consensusToText(
  list: { count: number; name: string; setCode?: string; number?: string }[],
): string {
  return list
    .map((e) =>
      e.setCode && e.number
        ? `${e.count} ${e.name} ${e.setCode} ${e.number}`
        : `${e.count} ${e.name}`,
    )
    .join("\n");
}

export default function ListLabPage() {
  const loadedQuery = useRef(false);
  const [deck, setDeck] = useState<DeckEditorValue>({
    name: "Untitled list",
    entries: [],
    rawText: "",
    errors: [],
    warnings: [],
  });
  const [editorKey, setEditorKey] = useState(0);
  const [report, setReport] = useState<ConsistencyMetrics | null>(null);
  const [swaps, setSwaps] = useState<SwapSuggestion[]>([]);
  const [saved, setSaved] = useState<DeckList[]>([]);
  const [shareUrl, setShareUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      setSaved(loadDecks());
    } catch {
      setSaved([]);
    }

    if (loadedQuery.current) return;
    loadedQuery.current = true;

    const share = readQueryParam("share");
    const archetypeId = readQueryParam("archetype");

    if (share) {
      try {
        const decoded = decodeShare(share);
        const entries = decoded.entries ?? [];
        setDeck({
          name: decoded.name ?? "Shared list",
          entries,
          rawText: entries.length ? exportToLimitlessText(entries) : "",
          errors: [],
          warnings: [],
        });
        setEditorKey((k) => k + 1);
        setMessage("Loaded shared list from URL.");
      } catch {
        setMessage("Could not decode share payload.");
      }
      return;
    }

    if (archetypeId) {
      const arch = getArchetypeById(archetypeId);
      if (!arch) {
        setMessage(`Unknown archetype: ${archetypeId}`);
        return;
      }
      const rawText = consensusToText(arch.consensusList);
      const parsed = parseDeckList(rawText);
      setDeck({
        name: arch.name,
        entries: parsed.entries,
        rawText,
        errors: parsed.errors,
        warnings: parsed.warnings,
      });
      setEditorKey((k) => k + 1);
      setMessage(
        `Loaded ${arch.name} consensus list (${parsed.entries.reduce((s, e) => s + e.count, 0)} cards).`,
      );
    }
  }, []);

  async function runAnalysis() {
    if (deck.entries.length === 0) {
      setMessage("Parse a list first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const consistency = runConsistencyReport(deck.entries, {
        trials: 400,
        seed: 42,
      });
      setReport(consistency);
      const suggestions = suggestSwaps(
        deck.entries,
        META_SNAPSHOT.fieldShare,
        42,
      ) as SwapSuggestion[];
      setSwaps(suggestions);
    } catch (err) {
      console.error(err);
      setMessage("Analysis module failed — is the engine still loading?");
    } finally {
      setBusy(false);
    }
  }

  function handleSave() {
    try {
      saveDeck({
        name: deck.name,
        entries: deck.entries,
      });
      setSaved(loadDecks());
      setMessage(`Saved “${deck.name}” to localStorage.`);
    } catch (err) {
      console.error(err);
      setMessage("Save failed.");
    }
  }

  function handleShare() {
    try {
      const payload = encodeShare(deck.entries, deck.name);
      const url = `${window.location.origin}/list?share=${encodeURIComponent(payload)}`;
      setShareUrl(url);
      void navigator.clipboard.writeText(url);
      setMessage("Share URL copied to clipboard.");
    } catch (err) {
      console.error(err);
      setMessage("Share encode failed.");
    }
  }

  function loadSaved(name: string) {
    const found = loadDecks().find((d) => d.name === name);
    if (!found) return;
    setDeck({
      name: found.name,
      entries: found.entries,
      rawText: exportToLimitlessText(found.entries),
      errors: [],
      warnings: [],
    });
    setEditorKey((k) => k + 1);
    setMessage(`Loaded “${name}”.`);
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="List Lab"
        title="Consistency & swaps"
        description="Paste a Limitless or PTCGL list, validate the 60, run mulligan/prize-lock trials, and get ranked swap suggestions against the current field. Import any TOP8 consensus list from Meta with ?archetype=."
        actions={<Badge tone="violet">localStorage · share URL</Badge>}
      />

      <DeckEditor
        key={editorKey}
        initialName={deck.name}
        initialText={deck.rawText}
        initialEntries={deck.entries}
        onChange={setDeck}
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={runAnalysis} disabled={busy}>
          {busy ? "Running…" : "Run consistency + swaps"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleSave}>
          Save list
        </Button>
        <Button type="button" variant="ghost" onClick={handleShare}>
          Copy share URL
        </Button>
      </div>

      {message && <p className="mt-3 text-sm text-cyan-300">{message}</p>}

      {shareUrl && (
        <Input className="mt-3 font-mono text-xs" readOnly value={shareUrl} />
      )}

      {saved.length > 0 && (
        <div className="mt-6 lab-panel p-4">
          <h3 className="mb-2 font-heading text-sm font-semibold">Saved lists</h3>
          <div className="flex flex-wrap gap-2">
            {saved.map((s) => (
              <Button
                key={s.name}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => loadSaved(s.name)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="mt-8">
          <ConsistencyReport report={report} swaps={swaps} />
        </div>
      )}
    </PageShell>
  );
}
