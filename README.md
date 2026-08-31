# TCG Lab XYZ

**Champions Lab for Pokémon TCG** — a competitive lab, not another results dump.

Unofficial fan toolkit for Standard (2026–27, regulation marks **H / I / J+**). Import a list or a TCG Live battle log, put the board on the table, and measure whether the next card you cut actually wins more prizes.

> Not affiliated with Nintendo, Creatures, GAME FREAK, The Pokémon Company, or TPCi. Not a TCG Live client, ranked ladder, private server, or Limitless replacement.

## Features

| Lab | What it does |
| --- | --- |
| **Card Lab** | Legal expansions + card pages with roles, when-good / when-brick, legality clock |
| **List Lab** | Limitless / PTCGL import, consistency, prize-lock, one-card-swap EV |
| **Board Lab** | Sandbox any position — self-play, legal lines, N seeded playouts |
| **Matchup** | Top-8 archetype Monte Carlo (G1 / G2 / Bo3) with honesty caveat |
| **Replay** | Paste Live log → scrub → **fork** into Board Lab |
| **Prizes** | Prize / KO cartography (attachments until lethal) |
| **Meta** | Rising cards, post-event techs, field EV — not a usage dump |
| **School** | Interactive lessons on a real board |

## Localhost

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the next free port if 3000 is taken — check the terminal).

If Champions Lab or another app already owns `:3000`, use:

```bash
npm run dev:alt   # http://localhost:3100
```

No cloud, database, or Live account required. Lists and board forks use `localStorage`.

### Scripts

```bash
npm run test            # full seeded QA suite
npm run test:engine
npm run test:lists
npm run test:replay
npm run test:analysis
npm run sync:cards      # optional remote set metadata dump
npm run sync:meta       # print vendored snapshot info
npm run typecheck
npm run build
```

## Engine honesty

The CPU engine plays games with **scripted staples + top-8 archetype cards**. Unscripted cards are catalogued but labeled “script missing — not simulated.” Same seed → identical games. An LLM is never in the game loop.

Every win-rate report prints:

> These numbers are engine + agent, not Worlds truth. Win rates track agent strength, not just card fidelity.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · headless seeded rules engine (RyuuPlay/twinleaf-inspired, original lab UI)

## License

MIT — fan project, free forever for study and testing.
