import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ThemeBadgeProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * ThemeBadge — MENPS design-system component.
 * Renders a single theme as a chip. Pass `onRemove` to make it removable
 * (used inside ThemeSelector); omit it for read-only display (used in
 * ProfileSummary and MentorCard/MentorDetailsModal).
 */
export function ThemeBadge({ label, onRemove, className }: ThemeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-light px-3 py-1.5 text-xs font-medium text-primary",
        className,
      )}
    >
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer ${label}`}
          className="shrink-0 rounded-full p-0.5 transition-colors duration-200 hover:bg-primary/15"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
