import { AlertTriangle } from "lucide-react";
import { SIM_CAVEAT } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CaveatBanner({ className }: { className?: string }) {
  return (
    <div className={cn("caveat-banner flex gap-3", className)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{SIM_CAVEAT.text}</p>
    </div>
  );
}
