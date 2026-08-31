import { PageHeader, PageShell } from "@/components/page-shell";

export default function TermsPage() {
  return (
    <PageShell narrow>
      <PageHeader
        eyebrow="Legal"
        title="Terms of use"
        description="Last updated: 31 August 2026. These terms govern your use of TCG Lab XYZ running locally or as you host it yourself."
      />

      <div className="lab-panel space-y-5 p-5 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">1. Unofficial fan project</h2>
          <p className="mt-2">
            TCG Lab XYZ is an unofficial fan-made toolkit. It is not affiliated with,
            endorsed by, or associated with Nintendo, Creatures Inc., GAME FREAK, The
            Pokémon Company, The Pokémon Company International, or any related entity.
            Pokémon and Pokémon character names are trademarks of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">2. Acceptable use</h2>
          <p className="mt-2">
            You may use this software for personal study, deck testing, and educational
            purposes. You may not use it to operate an unauthorized online game service,
            private server, ranked ladder, or any service that imitates Pokémon TCG Live or
            official tournament infrastructure.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">3. Card data & IP</h2>
          <p className="mt-2">
            Card names, text, artwork, and set information remain the property of their
            trademark and copyright holders. Any catalog data bundled for localhost use is
            for reference within this unofficial tool only. Do not redistribute card assets
            as a commercial product.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">4. Simulations are not truth</h2>
          <p className="mt-2">
            Win rates, consistency percentages, and matchup bars are produced by a rules
            engine and software agents. They do not guarantee tournament results. You agree
            not to present lab outputs as official standings, partnered analytics, or Worlds
            truth.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">5. No warranty</h2>
          <p className="mt-2">
            The software is provided “as is,” without warranty of any kind. Authors are not
            liable for losses arising from deck choices, tournament outcomes, or reliance on
            simulation numbers.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">6. Local hosting</h2>
          <p className="mt-2">
            When you run TCG Lab XYZ on localhost, you are responsible for your environment,
            dependencies, and any data you paste into the app (deck lists, battle logs).
            Sharing features that encode lists into URLs are opt-in and under your control.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold text-foreground">7. Changes</h2>
          <p className="mt-2">
            Terms may update as the project evolves. Continued use after updates constitutes
            acceptance of the revised terms.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
