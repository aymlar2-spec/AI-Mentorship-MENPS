import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import { compatibilityVariant } from "@/lib/matching";

/**
 * CompatibilityBadge — MENPS design-system component.
 * Renders the deterministic matching score (0-100, from
 * POST /api/v1/matching/me — see app/services/matching/engine.py) as a
 * color-coded badge.
 */
export function CompatibilityBadge({ score, className }: { score: number; className?: string }) {
  return (
    <Badge variant={compatibilityVariant(score)} className={className}>
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {score.toFixed(0)}% de compatibilité
    </Badge>
  );
}
