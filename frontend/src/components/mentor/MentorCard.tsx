import type { ReactNode } from "react";
import { Building2, Briefcase } from "lucide-react";
import { Avatar, Card } from "@/components/ui";
import { ThemeBadge } from "@/components/profile";
import { CompatibilityBadge } from "./CompatibilityBadge";
import type { Theme, User } from "@/types";

export interface MentorCardProps {
  mentor: User;
  score: number;
  explanation?: string;
  /** Optional — current_position/entity/themes, when accessible (see profilesApi.getByUserIdSafe). */
  currentPosition?: string | null;
  entity?: string | null;
  themes?: Theme[];
  /** "default" for the full Matching page grid, "compact" for Dashboard preview. */
  variant?: "default" | "compact";
  actions?: ReactNode;
}

/**
 * MentorCard — MENPS design-system component.
 * Renders a mentor recommendation with its deterministic compatibility
 * score and the algorithm's explanation, exactly as returned by
 * POST /api/v1/matching/me (see app/services/matching/engine.py).
 */
export function MentorCard({
  mentor,
  score,
  explanation,
  currentPosition,
  entity,
  themes,
  variant = "default",
  actions,
}: MentorCardProps) {
  const isCompact = variant === "compact";

  return (
    <Card padding={isCompact ? "sm" : "md"} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={mentor.full_name} size={isCompact ? 40 : 48} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{mentor.full_name}</p>
            {currentPosition ? (
              <p className="flex items-center gap-1 truncate text-xs text-text-muted">
                <Briefcase className="h-3 w-3 shrink-0" aria-hidden="true" />
                {currentPosition}
              </p>
            ) : (
              <p className="truncate text-xs text-text-muted">Mentor</p>
            )}
            {entity && !isCompact && (
              <p className="flex items-center gap-1 truncate text-xs text-text-muted">
                <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                {entity}
              </p>
            )}
          </div>
        </div>
        <CompatibilityBadge score={score} className="shrink-0" />
      </div>

      {explanation && !isCompact && (
        <p className="text-sm leading-relaxed text-text-muted">{explanation}</p>
      )}
      {explanation && isCompact && (
        <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">{explanation}</p>
      )}

      {themes && themes.length > 0 && !isCompact && (
        <div className="flex flex-wrap gap-1.5">
          {themes.map((theme) => (
            <ThemeBadge key={theme.id} label={theme.name} />
          ))}
        </div>
      )}

      {actions && <div className="flex items-center gap-2 pt-1">{actions}</div>}
    </Card>
  );
}
