import { cn } from "@/lib/cn";
import { compatibilityVariant } from "@/lib/matching";

const BAR_COLOR: Record<ReturnType<typeof compatibilityVariant>, string> = {
  success: "bg-success",
  primary: "bg-primary",
  warning: "bg-warning",
};

/**
 * CompatibilityProgress — MENPS design-system component.
 * Visual bar representation of the 0-100 matching score, used in the
 * Mentor Details modal alongside CompatibilityBadge's numeric summary.
 */
export function CompatibilityProgress({ score, className }: { score: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const variant = compatibilityVariant(score);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Score de compatibilité</span>
        <span className="font-medium text-text">{clamped.toFixed(0)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-background"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-200", BAR_COLOR[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
