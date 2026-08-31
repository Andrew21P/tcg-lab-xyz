"use client";

import { useMemo, useState } from "react";
import type { DeckEntry } from "@/lib/types";
import { parseDeckList, validateDeck } from "@/lib/lists/parse";
import { exportToLimitlessText } from "@/lib/lists/export";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DeckEditorValue = {
  name: string;
  entries: DeckEntry[];
  rawText: string;
  errors: string[];
  warnings: string[];
};

function bootstrapFromText(text: string): {
  entries: DeckEntry[];
  errors: string[];
  warnings: string[];
} {
  if (!text.trim()) {
    return { entries: [], errors: [], warnings: [] };
  }
  const parsed = parseDeckList(text);
  return {
    entries: parsed.entries,
    errors: parsed.errors,
    warnings: parsed.warnings,
  };
}

export function DeckEditor({
  initialText = "",
  initialName = "Untitled list",
  initialEntries,
  onChange,
  className,
}: {
  initialText?: string;
  initialName?: string;
  initialEntries?: DeckEntry[];
  onChange?: (value: DeckEditorValue) => void;
  className?: string;
}) {
  const boot = bootstrapFromText(initialText);
  const [name, setName] = useState(initialName);
  const [rawText, setRawText] = useState(initialText);
  const [entries, setEntries] = useState<DeckEntry[]>(
    initialEntries?.length ? initialEntries : boot.entries,
  );
  const [errors, setErrors] = useState<string[]>(boot.errors);
  const [warnings, setWarnings] = useState<string[]>(boot.warnings);
  const [copied, setCopied] = useState(false);

  const validation = useMemo(() => validateDeck(entries), [entries]);

  function emit(next: Partial<DeckEditorValue> & { entries?: DeckEntry[] }) {
    const value: DeckEditorValue = {
      name: next.name ?? name,
      entries: next.entries ?? entries,
      rawText: next.rawText ?? rawText,
      errors: next.errors ?? errors,
      warnings: next.warnings ?? warnings,
    };
    onChange?.(value);
  }

  function handleParse() {
    const parsed = parseDeckList(rawText);
    setEntries(parsed.entries);
    setErrors(parsed.errors);
    setWarnings(parsed.warnings);
    emit({
      entries: parsed.entries,
      errors: parsed.errors,
      warnings: parsed.warnings,
    });
  }

  function handleExport() {
    const text = exportToLimitlessText(entries);
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
    setRawText(text);
    emit({ rawText: text });
  }

  const total = entries.reduce((n, e) => n + e.count, 0);

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="lab-panel flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Paste list</h2>
          <Badge tone="cyan">Limitless / PTCGL</Badge>
        </div>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            emit({ name: e.target.value });
          }}
          className="h-10 rounded-lg border border-border bg-[#0a0e14] px-3 text-sm"
          placeholder="List name"
        />
        <Textarea
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            emit({ rawText: e.target.value });
          }}
          className="min-h-[280px]"
          placeholder={`Pokémon: 12\n4 Dreepy TWM 128\n...\nTrainer: 38\n...\nEnergy: 10`}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleParse}>
            Parse list
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleExport}
            disabled={entries.length === 0}
          >
            {copied ? "Copied" : "Export Limitless"}
          </Button>
        </div>
      </div>

      <div className="lab-panel flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Parsed entries</h2>
          <span className="lab-chip">{total} / 60</span>
        </div>

        <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Paste a list and hit Parse to populate entries.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={`${entry.card.id}-${entry.count}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-[#0a0e14]/70 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-mono text-cyan-300">{entry.count}×</span>{" "}
                  <span className="font-medium">{entry.card.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {entry.card.setCode} {entry.card.number}
                  </span>
                </div>
                <span className="mark-badge">{entry.card.regulationMark}</span>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-sm">
          <div className="mb-2 font-heading text-sm font-semibold">Validate</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="lab-chip">Pokémon {validation.pokemon}</span>
            <span className="lab-chip">Trainer {validation.trainer}</span>
            <span className="lab-chip">Energy {validation.energy}</span>
            <span className="lab-chip">ACE SPEC {validation.aceSpecs}</span>
            <Badge tone={validation.ok ? "cyan" : "danger"}>
              {validation.ok ? "Legal shape" : "Issues"}
            </Badge>
          </div>
          {(validation.errors.length > 0 || errors.length > 0) && (
            <ul className="mt-2 space-y-1 text-xs text-red-300">
              {[...validation.errors, ...errors].map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-300">
              {warnings.map((w) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
