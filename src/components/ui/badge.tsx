import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  tone = "default",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "default" | "cyan" | "violet" | "amber" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone === "default" &&
          "border-border bg-muted/60 text-muted-foreground",
        tone === "cyan" &&
          "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
        tone === "violet" &&
          "border-violet-400/30 bg-violet-400/10 text-violet-300",
        tone === "amber" &&
          "border-amber-400/35 bg-amber-400/10 text-amber-300",
        tone === "danger" &&
          "border-red-400/35 bg-red-400/10 text-red-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
