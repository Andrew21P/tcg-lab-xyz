import { PageHeader, PageShell } from "@/components/page-shell";

export default function PrivacyPage() {
  return (
    <PageShell narrow>
      <PageHeader
        eyebrow="Legal"
        title="Privacy"
        description="Last updated: 31 August 2026. TCG Lab XYZ is designed to run locally with minimal data collection."
      />

      <div className="lab-panel space-y-5 p-5 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">1. Local-first</h2>
          <p className="mt-2">
            The intended deployment is localhost. Deck lists you save, share-string payloads
            you generate, and forked board state in sessionStorage stay in your browser
            unless you copy them elsewhere or host the app behind your own infrastructure.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">2. What we store in your browser</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Saved deck lists in localStorage (names, entries, raw text)</li>
            <li>Optional share query parameters you place in URLs</li>
            <li>Forked replay positions in sessionStorage for Board Lab</li>
          </ul>
          <p className="mt-2">
            Clear site data in your browser to remove these. We do not require an account.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">3. No account / no tracking product</h2>
          <p className="mt-2">
            There is no login wall and no built-in advertising tracker. If you deploy this
            app on a public host, your hosting provider’s logs (IP, user-agent) may apply —
            that is outside this project’s default localhost scope.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">4. Content you paste</h2>
          <p className="mt-2">
            Battle logs and deck lists are processed in-page for parsing and simulation.
            Avoid pasting personal data (emails, real names beyond table nicknames) into
            share URLs you post publicly.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">5. Third-party images</h2>
          <p className="mt-2">
            Optional card imagery may load from images.pokemontcg.io when referenced. That
            service’s own policies apply to those requests.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">6. Contact</h2>
          <p className="mt-2">
            This is a fan project without a formal data controller entity. For local builds,
            you control the machine and the data on it.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
