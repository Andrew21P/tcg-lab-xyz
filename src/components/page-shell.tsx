import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
        narrow ? "max-w-3xl" : "max-w-[1440px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            {eyebrow}
          </div>
        )}
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function EmptyHint({
  children,
  href,
  linkLabel,
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="lab-panel p-6 text-center text-sm text-muted-foreground">
      <p>{children}</p>
      {href && linkLabel && (
        <Link href={href} className="mt-3 inline-block text-cyan-300 hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
