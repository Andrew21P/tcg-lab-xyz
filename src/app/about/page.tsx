import Link from "next/link";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";

const PILLARS = [
  {
    title: "Board first",
    body: "A list is a hypothesis. The board — prizes, attaches, gust windows — is where you falsify it.",
  },
  {
    title: "Measure the cut",
    body: "Swaps should move consistency or field EV. If you can’t say which, you’re collecting cardboard.",
  },
  {
    title: "Honest caveats",
    body: "Win rates track engine + agent strength, not Worlds truth. Every report carries the banner.",
  },
  {
    title: "Local & free",
    body: "TCG Lab XYZ runs on localhost. No account wall, no ladder clone, no private server.",
  },
];

export default function AboutPage() {
  return (
    <PageShell narrow>
      <PageHeader
        eyebrow="About"
        title="TCG Lab XYZ"
        description="A competitive Pokémon TCG bench for testing lists, boards, matchups, and prize tempo — not a results dump."
        actions={<Badge tone="cyan">fan toolkit</Badge>}
      />

      <section className="lab-panel space-y-3 p-5">
        <h2 className="font-heading text-lg font-semibold">Mission</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Help serious players import a list or Live log, put the board on the table, and
          measure whether the next card they cut actually wins more prizes. We optimize for
          study loops — consistency trials, matchup bars, prize maps — with simulation
          caveats visible at every win-rate surface.
        </p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.title} className="lab-panel p-4">
            <h3 className="font-heading text-base font-semibold text-cyan-200">{p.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="lab-panel p-4">
          <h3 className="font-heading text-sm font-semibold text-cyan-300">What we are</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• A localhost lab for Standard H/I/J+</li>
            <li>• List parse, consistency, swaps, matchups</li>
            <li>• Board sandbox + replay fork</li>
            <li>• Meta field-EV thinking aids</li>
            <li>• School drills for prize & supporter lines</li>
          </ul>
        </div>
        <div className="lab-panel p-4">
          <h3 className="font-heading text-sm font-semibold text-amber-300">What we aren’t</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Not affiliated with Nintendo / TPCi / Pokémon</li>
            <li>• Not a TCG Live client or ranked ladder</li>
            <li>• Not a private server or online play service</li>
            <li>• Not a Limitless replacement or usage dump</li>
            <li>• Not tournament truth — engine + agent only</li>
          </ul>
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        See also{" "}
        <Link href="/terms" className="text-cyan-300 hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-cyan-300 hover:underline">
          Privacy
        </Link>
        .
      </p>
    </PageShell>
  );
}
