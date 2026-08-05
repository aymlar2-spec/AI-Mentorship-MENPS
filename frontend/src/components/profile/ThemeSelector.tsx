import { useCallback } from "react";
import { Check, Tags } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsyncData } from "@/hooks/useAsyncData";
import { themesApi } from "@/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { ThemeBadge } from "./ThemeBadge";
import type { Theme } from "@/types";

export interface ThemeSelectorProps {
  value: string[];
  onChange: (themeIds: string[]) => void;
  max?: number;
  error?: string;
}

/**
 * ThemeSelector — MENPS design-system component.
 * Loads themes dynamically from GET /api/v1/themes and lets the user pick
 * up to `max` (default 3, matching the original questionnaire's "en
 * choisir 3 maximum"). Selected themes are shown as removable ThemeBadge
 * chips above the picker.
 */
export function ThemeSelector({ value, onChange, max = 3, error }: ThemeSelectorProps) {
  const fetchThemes = useCallback(() => themesApi.list(), []);
  const {
    data: themes,
    isLoading,
    isError,
    isEmpty,
    error: loadError,
    refetch,
  } = useAsyncData(fetchThemes);

  function toggle(theme: Theme) {
    const isSelected = value.includes(theme.id);
    if (isSelected) {
      onChange(value.filter((id) => id !== theme.id));
    } else if (value.length < max) {
      onChange([...value, theme.id]);
    }
  }

  const selectedThemes = (themes ?? []).filter((t) => value.includes(t.id));

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedThemes.map((theme) => (
            <ThemeBadge key={theme.id} label={theme.name} onRemove={() => toggle(theme)} />
          ))}
        </div>
      )}

      {isLoading && <LoadingState label="Chargement des thématiques…" />}

      {isError && <ErrorState description={loadError ?? undefined} onRetry={refetch} />}

      {isEmpty && (
        <EmptyState
          icon={<Tags className="h-5 w-5" />}
          title="Aucune thématique disponible"
          description="Contactez un administrateur pour ajouter des thématiques."
        />
      )}

      {!isLoading && !isError && !isEmpty && themes && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Thématiques d'intérêt">
            {themes.map((theme) => {
              const isSelected = value.includes(theme.id);
              const isDisabled = !isSelected && value.length >= max;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => toggle(theme)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                    isSelected
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border-strong text-text hover:bg-black/[0.03]",
                    isDisabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  {theme.name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-text-muted">
            {value.length}/{max} sélectionnée{value.length > 1 ? "s" : ""}
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
