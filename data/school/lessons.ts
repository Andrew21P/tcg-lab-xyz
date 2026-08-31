import type { GameState, PlayerState } from "@/lib/engine/state";

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  goal: string;
  boardSetup: Partial<Omit<GameState, "players">> & {
    players?: [Partial<PlayerState>?, Partial<PlayerState>?];
  };
  successCheck: string;
  teachingNotes: string;
  /** 3–6 paragraphs of real teaching prose */
  body: string[];
  tips: string[];
};

export const LESSONS: Lesson[] = [
  {
    id: "prize-economy",
    title: "Prize economy",
    summary:
      "1- vs 2- vs 3-prize Pokémon, and why Fezandipiti / Unfair Stamp change race math.",
    goal: "Map which bodies are 1-, 2-, and 3-prize and plan KOs that finish in two turns.",
    boardSetup: {
      turn: 3,
      activePlayer: 0,
      phase: "player-turn",
      firstPlayer: 0,
      seed: 11,
      players: [
        {
          prizeCount: 4,
          hand: [
            { instanceId: "h1", cardId: "pre-132", name: "Boss's Orders" },
            { instanceId: "h2", cardId: "scr-160", name: "Counter Catcher" },
            { instanceId: "h3", cardId: "sfa-038", name: "Fezandipiti ex" },
          ],
        },
        {
          prizeCount: 6,
        },
      ],
    },
    successCheck:
      "Prefer knocking a 2-prize Active when you can take two prizes this turn; leave Fezandipiti for when you need the draw engine more than the prize race.",
    teachingNotes:
      "Every KO is a prize transaction. Basic non-Rule Box Pokémon are usually 1 prize; Pokémon ex / V / VMAX / VSTAR / Radiant are 2; some Mega/ACE lines can be 3. Fezandipiti ex is a 2-prize draw engine — knocking it races the game but also turns off Flip. Unfair Stamp as ACE SPEC punishes Item-heavy boards after a KO, often when you are ahead on prizes.",
    body: [
      "Pokémon TCG games are races to six prizes. A KO on a Basic non-Rule Box Pokémon usually takes one prize; knocking a Pokémon ex (or older V/VMAX/VSTAR) takes two. Some Mega Evolution and special Rule Boxes can be three. Before you attack, ask: how many prizes does this KO give me, and how many does my next KO need to leave?",
      "Fezandipiti ex is the classic tension. Its Flip ability draws when you take a prize, so it is often the best Pokémon on your bench for card advantage — but it is also a two-prize body. Leaving Fezandipiti up while you snipe a one-prize attacker can be correct if you need the draws; Bossing into Fezandipiti when you are on two prizes is often the race win.",
      "Unfair Stamp is an ACE SPEC that, after you knock out a Pokémon, can strip the opponent’s hand of Items. It matters most when you are ahead on prizes and the opponent’s recovery path is Nest Ball / Ultra Ball / Poffin loops. Playing Stamp just because you can KO is wrong if you still need those Item answers yourself next turn.",
      "Build a habit: count prizes remaining for both players every turn, then label every in-play Pokémon as 1 / 2 / 3 prize. Your attack line should finish the race in the fewest turns, not the biggest single hit.",
    ],
    tips: [
      "Write 1P / 2P / 3P next to every Pokémon on the board before choosing an attack.",
      "Fezandipiti KO is often correct on the last two prizes, wrong when you still need Flip for two turns.",
      "Unfair Stamp after a KO when ahead on prizes; hold it if you are the Item-heavy deck.",
    ],
  },
  {
    id: "supporter-economy",
    title: "Supporter economy",
    summary:
      "One Supporter per turn — Iono, Research, Arven, and Crispin in concrete board states.",
    goal: "Pick the Supporter that advances the board this turn without brickling next turn.",
    boardSetup: {
      turn: 2,
      activePlayer: 0,
      phase: "player-turn",
      firstPlayer: 0,
      seed: 22,
      players: [
        {
          prizeCount: 6,
          hand: [
            { instanceId: "h1", cardId: "ssp-185", name: "Iono" },
            { instanceId: "h2", cardId: "pre-133", name: "Professor's Research" },
            { instanceId: "h3", cardId: "ssp-169", name: "Arven" },
            { instanceId: "h4", cardId: "scr-133", name: "Crispin" },
            { instanceId: "h5", cardId: "twm-144", name: "Buddy-Buddy Poffin" },
          ],
        },
        {
          prizeCount: 6,
        },
      ],
    },
    successCheck:
      "Use Arven when you need Item+Tool setup, Crispin when you need dual Energy attach, Research when your hand is trash and board is built, Iono when both hands are awkward mid-game.",
    teachingNotes:
      "You may play only one Supporter per turn. That slot is often more important than your attack. Arven tutors an Item and a Tool — Secret Box / Maximum Belt / Buddy-Buddy lines. Crispin attaches two different basic Energies from deck (with constraints) and is the ramp exception that wins Blaziken / multi-type boards. Research discards your hand for seven; Iono shuffles both players to prize count.",
    body: [
      "Every turn you get at most one Supporter. Treat that slot like a resource: if you spend it on the wrong redraw, you cannot Arven for the Tool you needed to attack, and if you Arven when your hand is already dead, you never find the seven-card Research.",
      "Professor's Research is selfish full redraw. Play it when your hand is mostly dead cards and your board already has the attacker you need this turn. Do not Research away Boss, Candy, or the Energy you still need to attach.",
      "Iono scales with prizes remaining and hits both players. It is strongest when you are mid-prizes (often 3–5 left), your hand is awkward, and the opponent’s hand looks stacked. Early game with six prizes, Iono often redraws into another six-card brick for both players.",
      "Arven searches an Item and a Pokémon Tool. Use it when the turn’s bottleneck is setup: Rare Candy + Maximum Belt, Nest Ball + Hero’s Bond, Counter Catcher + leftover Item. Crispin is the Energy turn: when your attacker needs two different Energies and you only have the one free attach, Crispin’s dual attach from deck is the whole plan.",
    ],
    tips: [
      "Ask: do I need cards, Energy, or a specific Item/Tool this turn?",
      "Never Research if Boss or Candy in hand is required for the KO.",
      "Crispin before attacking on ramp turns; Arven before attacking on Tool turns.",
    ],
  },
  {
    id: "energy-attach",
    title: "Energy attach rules",
    summary:
      "One Energy from hand per turn, Crispin’s exception, and flood vs starve planning.",
    goal: "Sequence the free attach and Crispin so your attacker is live without starving next turn.",
    boardSetup: {
      turn: 2,
      activePlayer: 0,
      phase: "player-turn",
      firstPlayer: 1,
      seed: 33,
      players: [
        {
          prizeCount: 6,
          hand: [
            { instanceId: "h1", cardId: "scr-133", name: "Crispin" },
            { instanceId: "h2", cardId: "ssp-209", name: "Psychic Energy" },
            { instanceId: "h3", cardId: "tef-163", name: "Earthen Vessel" },
          ],
        },
        {
          prizeCount: 6,
        },
      ],
    },
    successCheck:
      "Spend the free attach on the Pokémon that attacks this turn; use Crispin only when two different Energies unlock the attack now.",
    teachingNotes:
      "Unless an effect says otherwise, you attach only one Energy from hand each turn. Vessel, Buddy-Buddy loops, and abilities that move Energy are separate. Crispin lets you attach two different basic Energies from deck as a Supporter effect — that is not your free attach, so you can still attach from hand the same turn if legal. Flooding Energy onto a bench body that cannot attack this turn often loses the race.",
    body: [
      "The free Energy attach is one of the scarcest resources in the game. Most Standard attackers need two or three Energies; if you miss an attach for a turn, you often miss the KO and concede prize tempo.",
      "Crispin is the main exception players misplay. As a Supporter, Crispin puts two different basic Energies from your deck onto one of your Pokémon. That effect does not consume your free hand attach — so on a Crispin turn you can often go from zero Energies to fully powered if you also have an Energy in hand.",
      "Energy flood is putting extra Energies on a bench attacker “for next turn” while your Active cannot KO. Energy starve is clinging to Energies in hand when the board already has a live attacker. Both lose: flood if the bench body gets Bossed and discarded; starve if you never take the prize this turn.",
      "Plan Energy two turns ahead. If you need Psychic + Fire for Blaziken next turn, Crispin this turn or Vessel into attach now. If Dragapult only needs one more Psychic, the free attach is the whole turn — do not burn Supporter on Crispin.",
    ],
    tips: [
      "Free attach first on the attacker that takes prizes this turn.",
      "Crispin when you need two different types from deck; Vessel when you need one type from deck into hand.",
      "Do not overcommit Energies onto a 2-prize bench body the opponent can Catcher.",
    ],
  },
  {
    id: "iono-vs-research",
    title: "Iono vs Professor's Research",
    summary:
      "When to hit both hands vs when to take a selfish seven.",
    goal: "Choose the correct redraw based on prize count and hand quality.",
    boardSetup: {
      turn: 4,
      activePlayer: 0,
      phase: "player-turn",
      firstPlayer: 0,
      seed: 101,
      players: [
        {
          prizeCount: 4,
          hand: [
            { instanceId: "h1", cardId: "ssp-185", name: "Iono" },
            { instanceId: "h2", cardId: "pre-133", name: "Professor's Research" },
            { instanceId: "h3", cardId: "ssp-196", name: "Ultra Ball" },
          ],
        },
        {
          prizeCount: 5,
        },
      ],
    },
    successCheck:
      "Play Iono when both hands are awkward and prizes are mid; play Research when your hand is disposable and you need seven fresh cards without refilling the opponent.",
    teachingNotes:
      "Iono scales with prizes remaining and hits both players. Research is selfish redraw. Mid-game brick with 4 prizes left usually prefers Iono; a dead opening hand with a built board prefers Research.",
    body: [
      "Both cards fix bad hands, but they solve different problems. Professor's Research discards your hand and draws seven — the opponent’s hand is untouched. Iono shuffles your hand and the opponent’s hand into the deck, then each player draws cards equal to their remaining prize count.",
      "When you have four prizes left, Iono draws four. That is often enough to find Boss or Candy while also shrinking a stacked opponent hand. When you have six prizes left on turn one or two, Iono draws six into six — frequently another brick for both players.",
      "Research is correct when your board is already threatening and your hand is pure trash: dead Tools, extra Basics, Stadiums you will never play. You want seven new cards and you do not want to gift the opponent a redraw.",
      "Heuristic for this board (you 4 prizes, opponent 5): if your three-card hand cannot take a prize and the opponent looks stocked, Iono. If you already have the attacker powered and only need one more gust or Candy, Research (or skip redraw and just play the Item).",
    ],
    tips: [
      "Count both prize totals before choosing Iono.",
      "Never Iono away the only Boss that wins the game this turn.",
      "Research early, Iono mid — then re-evaluate every turn.",
    ],
  },
  {
    id: "boss-counter-catcher",
    title: "Boss vs Counter Catcher",
    summary:
      "Gust sequencing when ahead or behind on prizes.",
    goal: "Pick the legal gust that preserves prize tempo.",
    boardSetup: {
      turn: 5,
      activePlayer: 0,
      phase: "player-turn",
      seed: 404,
      players: [
        {
          prizeCount: 3,
          hand: [
            { instanceId: "h1", cardId: "pre-132", name: "Boss's Orders" },
            { instanceId: "h2", cardId: "scr-160", name: "Counter Catcher" },
            { instanceId: "h3", cardId: "ssp-185", name: "Iono" },
          ],
        },
        {
          prizeCount: 2,
        },
      ],
    },
    successCheck:
      "With more prizes remaining than the opponent, Counter Catcher is live; Boss always works but costs the Supporter for the turn.",
    teachingNotes:
      "Behind on prizes → Counter Catcher Item gust. Need a gust while ahead or tied → Boss's Orders. Don't waste Boss when Catcher is free.",
    body: [
      "Gust effects move an opponent’s Benched Pokémon into the Active Spot so you can KO the right prize body. Boss's Orders is a Supporter gust that always works. Counter Catcher is an Item that only works when you have more prizes remaining than your opponent — that is, when you are behind in the race.",
      "On this board you have 3 prizes left and the opponent has 2. You are behind, so Counter Catcher is legal. Using Catcher saves your Supporter for Iono, Research, Arven, or a second Boss later.",
      "If you were ahead or tied on prizes, Catcher would be dead and Boss would be mandatory. Players lose games by holding Catcher “for later” while they are ahead, then never drawing Boss for the critical gust.",
      "Sequence: identify the KO target on the bench → check prize counts → if behind, Catcher; if not, Boss. Only Boss when Catcher is illegal or you need to gust twice across two turns and already used Catcher.",
    ],
    tips: [
      "Behind on prizes = Counter Catcher first.",
      "Ahead or tied = Boss's Orders (Catcher is off).",
      "Do not Boss if Catcher is live and you still need a Supporter redraw.",
    ],
  },
  {
    id: "phantom-dive-math",
    title: "Phantom Dive prize math",
    summary:
      "Dragapult spread into Boss turns — place the 60 damage where it sets up snipes.",
    goal: "Distribute 6 bench damage counters to set up a two-prize Boss turn.",
    boardSetup: {
      turn: 3,
      activePlayer: 0,
      phase: "player-turn",
      seed: 303,
      players: [
        {
          prizeCount: 4,
          hand: [
            { instanceId: "h1", cardId: "pre-132", name: "Boss's Orders" },
            { instanceId: "h2", cardId: "scr-160", name: "Counter Catcher" },
            { instanceId: "h3", cardId: "sfa-072", name: "Munkidori" },
          ],
        },
        {
          prizeCount: 6,
        },
      ],
    },
    successCheck:
      "After Phantom Dive, leave two benched threats in KO range for Boss's Orders / Counter Catcher rather than spreading randomly.",
    teachingNotes:
      "Phantom Dive is a sequencing card: 200 to Active plus 60 on the Bench. Map which Pokémon are 1- and 2-prize, then gust the correct body next turn.",
    body: [
      "Dragapult ex’s Phantom Dive deals heavy damage to the Active and lets you place six damage counters (60 damage) on the opponent’s Bench however you like. The Active hit takes prizes now; the bench placement sets up next turn’s Boss or Catcher KO.",
      "Do not spray 10 damage on six different Pokémon. Prefer finishing numbers: put 60 on a 70–90 HP Basic so it dies to a later Munkidori move or a weak attack; or put 30/30 on two mid-HP bodies you can finish with Dive next turn after a gust.",
      "Always label prize values. Putting 60 on a Fezandipiti that you can Boss next turn for two prizes is usually better than finishing a 1-prize Charmander that was never threatening.",
      "After Dive, ask: if I Boss next turn, which bench Pokémon dies to the next Phantom Dive or partner attack? If the answer is “none,” you placed the counters wrong.",
    ],
    tips: [
      "Place bench damage to create a KO with next turn’s attack + gust.",
      "Prioritize 2-prize bodies already in range.",
      "Munkidori can move 30 — leave totals that 30 finishes.",
    ],
  },
  {
    id: "when-to-concede-g1",
    title: "When to concede Game 1",
    summary:
      "Bo3 clock, G2 first/second choice, and mental game — Standard has no sideboard.",
    goal: "Identify a lost G1 so you can reset cleanly for the set.",
    boardSetup: {
      turn: 6,
      activePlayer: 0,
      phase: "player-turn",
      firstPlayer: 1,
      seed: 202,
      players: [
        {
          prizeCount: 5,
          hand: [
            { instanceId: "h1", cardId: "ssp-194", name: "Switch" },
          ],
        },
        {
          prizeCount: 1,
        },
      ],
    },
    successCheck:
      "Concede when opponent is on 1 prize, you have no gust + KO, and the clock or G2 prep matters more than a 5% steal.",
    teachingNotes:
      "Standard has no sideboard — conceding G1 is about clock, information, and choosing to go first or second in G2. Stalling a hopeless board burns time and tilt.",
    body: [
      "Pokémon TCG Best-of-3 at most events has a shared clock. Game 1 that is already over still eats minutes you need for Games 2 and 3. Standard format also has no sideboard: you do not “side in” hate cards between games. Your list is fixed; what changes is who goes first and how you sequence.",
      "On this board the opponent has one prize left and you have five. Unless you can gust a vulnerable bench Pokémon and take enough prizes to race (almost never from 5), the game is over. Playing it out to “see one more draw” usually only shows the opponent your techs.",
      "After a concession, decide G2 first/second with intent. Going first is often better for setup decks (Stage 2, Festival engines). Going second can be better when you need the Extra Energy attach or an early Item gust. Ask which role your deck wants against this matchup.",
      "Mental game: concede cleanly, reshuffle, and name your G2 plan in one sentence (“I go first, Poffin into Candy Dragapult”). Do not argue the lost board. The lab treats concede as a legal action — use it when EV favors the set, not the single game.",
    ],
    tips: [
      "No Standard sideboard — concede is clock + first/second, not boarding.",
      "If opponent is on 1 prize and you cannot race, scoop.",
      "Decide G2 first or second before the judge asks.",
    ],
  },
  {
    id: "mulligan-basics",
    title: "Mulligan basics",
    summary:
      "No Basic Pokémon means mulligan; Poffin and Nest Ball plans for opening hands.",
    goal: "Keep or mulligan with a clear turn-1 / turn-2 evolution plan.",
    boardSetup: {
      turn: 0,
      activePlayer: 0,
      phase: "setup",
      firstPlayer: 0,
      seed: 505,
      players: [
        {
          prizeCount: 6,
          hand: [
            { instanceId: "h1", cardId: "ssp-196", name: "Ultra Ball" },
            { instanceId: "h2", cardId: "ssp-191", name: "Rare Candy" },
            { instanceId: "h3", cardId: "pre-133", name: "Professor's Research" },
            { instanceId: "h4", cardId: "ssp-209", name: "Psychic Energy" },
            { instanceId: "h5", cardId: "ssp-209", name: "Psychic Energy" },
            { instanceId: "h6", cardId: "twm-130", name: "Dragapult ex" },
            { instanceId: "h7", cardId: "sfa-038", name: "Fezandipiti ex" },
          ],
        },
        {
          prizeCount: 6,
        },
      ],
    },
    successCheck:
      "Mulligan any hand with no Basic Pokémon; keep hands that can Active a Basic and search more Basics with Poffin / Nest Ball on turn 1.",
    teachingNotes:
      "Opening setup requires at least one Basic to place as Active. No Basic = mandatory mulligan (opponent draws a card for each mulligan you take). Buddy-Buddy Poffin puts two Basics with 70 HP or less onto the Bench from deck; Nest Ball searches any Basic into hand. Plan openings around those tutors.",
    body: [
      "At the start of the game each player draws seven and must place one Basic Pokémon as Active (and may bench more Basics). If your seven cards contain zero Basics, you mulligan: shuffle, draw seven again, and your opponent draws one extra card for each mulligan you take.",
      "This sample hand has Dragapult ex and Fezandipiti ex — both are Basics (Rule Box Basics still count). You can Active Fezandipiti or Dragapult. A hand of only Rare Candy, Ultra Ball, Research, and Energies with no Basic is an automatic mulligan even if it “looks good.”",
      "Buddy-Buddy Poffin is the best turn-1 play in many Stage 2 decks: put two ≤70 HP Basics from deck onto the Bench (often Dreepy / Gastly / Duskull lines). Nest Ball puts any Basic into hand — better when you need Fezandipiti or a specific attacker Basic rather than two small Stage 1 fodder Basics.",
      "Keep criteria: Active Basic available, plus either a search Item (Poffin / Nest / Ball) or enough Basics already in hand to bench. Mulligan “god hands” that cannot put a Basic in play. After mulligans, remember the opponent drew extra cards — play slightly tighter on information.",
    ],
    tips: [
      "No Basic in seven = mulligan every time.",
      "Poffin for two small Basics; Nest Ball for a specific Basic into hand.",
      "Prefer Active Fezandipiti when you need early Flip draws.",
    ],
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function getAllLessons(): Lesson[] {
  return LESSONS;
}
