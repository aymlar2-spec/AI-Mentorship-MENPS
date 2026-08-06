import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Tags, Trash2 } from "lucide-react";
import { Button, ConfirmModal, EmptyState, ErrorState, Input, LoadingState } from "@/components/ui";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/hooks/useToast";
import { themesApi } from "@/api";
import { getErrorMessage } from "@/lib/errors";
import { themeCreateSchema, type ThemeCreateFormValues } from "@/schemas/admin";
import type { Theme } from "@/types";

export function ThemeManager() {
  const { showToast } = useToast();
  const [pendingDeleteTheme, setPendingDeleteTheme] = useState<Theme | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchThemes = useCallback(() => themesApi.list(), []);
  const { data: themes, isLoading, isError, isEmpty, error, refetch } = useAsyncData(fetchThemes);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ThemeCreateFormValues>({
    resolver: zodResolver(themeCreateSchema),
    defaultValues: { name: "" },
  });

  async function handleCreate(values: ThemeCreateFormValues) {
    setIsCreating(true);
    try {
      await themesApi.create(values);
      showToast({ variant: "success", title: "Thématique créée" });
      reset({ name: "" });
      await refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de créer la thématique.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsCreating(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteTheme) return;
    setIsDeleting(true);
    try {
      await themesApi.remove(pendingDeleteTheme.id);
      showToast({ variant: "success", title: "Thématique supprimée" });
      setPendingDeleteTheme(null);
      await refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de supprimer la thématique.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        Ces thématiques alimentent le questionnaire de profil et le moteur de matching.
      </p>

      <form onSubmit={handleSubmit(handleCreate)} noValidate className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            placeholder="Nouvelle thématique…"
            aria-label="Nom de la nouvelle thématique"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>
        <Button type="submit" leftIcon={<Plus className="h-4 w-4" />} isLoading={isCreating}>
          Ajouter
        </Button>
      </form>

      {isLoading && <LoadingState label="Chargement des thématiques…" />}
      {isError && (
        <ErrorState
          title="Impossible de charger les thématiques"
          description={error ?? undefined}
          onRetry={refetch}
        />
      )}
      {isEmpty && (
        <EmptyState
          icon={<Tags className="h-5 w-5" />}
          title="Aucune thématique"
          description="Ajoutez la première thématique ci-dessus."
        />
      )}

      {!isLoading && !isError && !isEmpty && themes && (
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-card)] border border-border bg-card">
          {themes.map((theme) => (
            <li key={theme.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-text">{theme.name}</span>
              <button
                type="button"
                onClick={() => setPendingDeleteTheme(theme)}
                aria-label={`Supprimer ${theme.name}`}
                className="shrink-0 rounded-full p-2 text-text-muted transition-colors duration-200 hover:bg-danger-light hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={pendingDeleteTheme !== null}
        onClose={() => setPendingDeleteTheme(null)}
        onConfirm={confirmDelete}
        title="Supprimer cette thématique ?"
        description={`"${pendingDeleteTheme?.name ?? ""}" sera retirée des profils qui l'utilisent.`}
        confirmLabel="Supprimer"
        isConfirming={isDeleting}
      />
    </div>
  );
}
