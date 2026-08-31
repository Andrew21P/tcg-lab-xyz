"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Layers,
  FlaskConical,
  Swords,
  ScrollText,
  TrendingUp,
  GraduationCap,
  Heart,
  Trophy,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Card Lab", icon: LayoutGrid },
  { href: "/list", label: "List Lab", icon: Layers },
  { href: "/board", label: "Board", icon: FlaskConical },
  { href: "/matchup", label: "Matchup", icon: Swords },
  { href: "/replay", label: "Replay", icon: ScrollText },
  { href: "/prizes", label: "Prizes", icon: Trophy },
  { href: "/meta", label: "Meta", icon: TrendingUp },
  { href: "/school", label: "School", icon: GraduationCap },
  { href: "/about", label: "About", icon: Heart },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[#0b0f14]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-violet-500/20 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <FlaskConical className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="hidden sm:block">
            <div className="font-heading text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-300">
              TCG Lab XYZ
            </div>
            <div className="-mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Competitive lab · not a results dump
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/5 text-foreground border border-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="xl:hidden rounded-lg border border-border p-2 text-muted-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border px-4 py-3 xl:hidden">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-white/5 text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.03]",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
