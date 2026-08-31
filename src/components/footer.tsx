import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-[#080b10]/90">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs leading-relaxed text-muted-foreground">
          TCG Lab XYZ is an unofficial fan toolkit for testing and study. It is
          not affiliated with, endorsed by, or associated with Nintendo,
          Creatures, GAME FREAK, The Pokémon Company, or TPCi. Pokémon and
          Pokémon character names are trademarks of their respective owners.
          Card names, text, and art remain their trademarks. This app is not a
          TCG Live client, ranked ladder, private server, or Limitless
          replacement.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <Link href="/about" className="hover:text-cyan-300">
            About
          </Link>
          <Link href="/terms" className="hover:text-cyan-300">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-cyan-300">
            Privacy
          </Link>
          <span className="text-border">·</span>
          <span>Simulation caveat on every win-rate report</span>
        </div>
      </div>
    </footer>
  );
}
