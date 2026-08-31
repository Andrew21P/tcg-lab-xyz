"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeckEntry } from "@/lib/types";
import {
  setupGame,
  getLegalActions,
  applyAction,
  playGame,
  heuristicAgent,
  deserializeState,
  fromPosition,
  type GameState,
  type Action,
} from "@/lib/engine";
import { parseDeckList } from "@/lib/lists/parse";
import { loadDecks } from "@/lib/lists/storage";
import { BoardView, type BoardAction, type BoardGameState } from "@/components/board-view";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Mode = "play" | "legal" | "playouts";

function emptySandbox(): GameState {
  return fromPosition({
    turn: 1,
    activePlayer: 0,
    phase: "player-turn",
    seed: 0,
  });
}

function asBoard(state: GameState): BoardGameState {
  return state as unknown as BoardGameState;
}

export default function BoardLabPage() {
  const [mode, setMode] = useState<Mode>("play");
  const [seed, setSeed] = useState(1337);
  const [listText, setListText] = useState("");
  const [oppText, setOppText] = useState("");
  const [state, setState] = useState<GameState>(() => emptySandbox());
  const [legal, setLegal] = useState<BoardAction[]>([]);
  const [playoutSummary, setPlayoutSummary] = useState("");
  const [n, setN] = useState(50);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  const savedNames = useMemo(() => {
    if (!mounted) return [] as string[];
    try {
      return loadDecks().map((d) => d.name);
    } catch {
      return [] as string[];
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("fork") !== "1") return;
      const raw = sessionStorage.getItem("tcglab:fork");
      if (!raw) return;
      const partial = JSON.parse(raw);
      const restored =
        typeof fromPosition === "function"
          ? fromPosition(partial)
          : deserializeState(raw);
      setState(restored);
      setMessage("Forked replay frame loaded into sandbox.");
      sessionStorage.removeItem("tcglab:fork");
    } catch (err) {
      console.error(err);
      setMessage("Fork payload present but could not restore state.");
    }
  }, []);

  function parseEntries(text: string): DeckEntry[] {
    return parseDeckList(text).entries;
  }

  function refreshLegal(game?: GameState) {
    const s = game ?? state;
    try {
      const actions = getLegalActions(s, s.activePlayer) as BoardAction[];
      setLegal(actions);
    } catch {
      setLegal([]);
    }
  }

  function loadGame() {
    try {
      const a = parseEntries(listText);
      const b = oppText.trim() ? parseEntries(oppText) : a;
      if (a.length === 0) {
        setState(emptySandbox());
        setMessage("Empty sandbox — paste a list or keep exploring.");
        return;
      }
      const game = setupGame(a, b, seed);
      setState(game);
      refreshLegal(game);
      setMessage("Game set up from lists.");
    } catch (err) {
      console.error(err);
      setMessage("setupGame failed — check list parse / engine.");
    }
  }

  function onAction(action: BoardAction) {
    try {
      const next = applyAction(state, action as Action);
      setState(next);
      refreshLegal(next);
    } catch (err) {
      console.error(err);
      setMessage("applyAction failed.");
    }
  }

  function runPlayouts() {
    try {
      const a = parseEntries(listText);
      const b = oppText.trim() ? parseEntries(oppText) : a;
      if (!a.length) {
        setMessage("Need a list for playouts.");
        return;
      }
      let w0 = 0;
      let w1 = 0;
      let draws = 0;
      for (let i = 0; i < n; i++) {
        const r = playGame(a, b, seed + i, heuristicAgent, heuristicAgent, 60);
        if (r.winner === 0) w0++;
        else if (r.winner === 1) w1++;
        else draws++;
      }
      setPlayoutSummary(
        `N=${n} seed=${seed} → P1 ${w0} / P2 ${w1} / draw ${draws}. ${((w0 / n) * 100).toFixed(1)}% P1.`,
      );
    } catch (err) {
      console.error(err);
      setMessage("playouts failed.");
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Board Lab"
        title="Put the board on the table"
        description="Load a list or start empty. Play legal actions, scrub modes, or batch N heuristic playouts with a fixed seed."
        actions={<Badge tone="cyan">Differentiator</Badge>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["play", "legal", "playouts"] as Mode[]).map((m) => (
          <Button
            key={m}
            type="button"
            variant={mode === m ? "default" : "secondary"}
            onClick={() => setMode(m)}
          >
            {m === "play" ? "Play" : m === "legal" ? "Legal actions" : "N playouts"}
          </Button>
        ))}
        <Input
          type="number"
          className="w-28"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
          aria-label="Seed"
        />
        {savedNames.length > 0 && (
          <Badge tone="violet">{savedNames.length} saved lists</Badge>
        )}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <div className="lab-panel space-y-2 p-4">
          <h3 className="text-sm font-semibold text-cyan-300">Your list</h3>
          <Textarea
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            className="min-h-[140px]"
            placeholder="Paste Limitless / PTCGL list…"
          />
        </div>
        <div className="lab-panel space-y-2 p-4">
          <h3 className="text-sm font-semibold text-violet-300">Opponent list</h3>
          <Textarea
            value={oppText}
            onChange={(e) => setOppText(e.target.value)}
            className="min-h-[140px]"
            placeholder="Optional — mirrors yours if empty"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button type="button" onClick={loadGame}>
          Setup game
        </Button>
        <Button type="button" variant="secondary" onClick={() => refreshLegal()}>
          Refresh legal
        </Button>
        {mode === "playouts" && (
          <>
            <Input
              type="number"
              className="w-24"
              value={n}
              onChange={(e) => setN(Number(e.target.value) || 1)}
            />
            <Button type="button" variant="secondary" onClick={runPlayouts}>
              Run playouts
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setState(emptySandbox());
            setLegal([]);
            setMessage("Cleared to empty sandbox.");
          }}
        >
          Empty sandbox
        </Button>
      </div>

      {message && <p className="mb-4 text-sm text-cyan-300">{message}</p>}
      {playoutSummary && (
        <div className="mb-4 lab-panel p-3 text-sm text-amber-200">{playoutSummary}</div>
      )}

      <BoardView
        state={asBoard(state)}
        legalActions={mode === "legal" || mode === "play" ? legal : []}
        onAction={mode === "play" || mode === "legal" ? onAction : undefined}
      />
    </PageShell>
  );
}
