import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, EmptyState, ErrorState, LoadingState, Modal, Select } from "@/components/ui";
import { useAsyncData } from "@/hooks/useAsyncData";
import { matchingApi } from "@/api";
import { explainMatchSchema, type ExplainMatchFormValues } from "@/schemas/ai";
import { Users2 } from "lucide-react";
import type { SelectOption } from "@/components/ui";

export interface ExplainMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (values: ExplainMatchFormValues) => Promise<void>;
}

/**
 * Fetches the mentee's CURRENT top mentor matches via the live matching
 * endpoint (POST /api/v1/matching/me), not /matching/history/me. The live
 * response embeds the full mentor User object; the history endpoint only
 * returns a bare mentor_id, and GET /api/v1/users/{id} is owner/admin-only
 * (see app/routers/users.py), so a mentee cannot resolve a mentor's name
 * from history alone. See Sprint 4 notes for details — this is the same
 * class of backend limitation found in Sprint 3 for profiles/{user_id}.
 */
async function fetchMentorOptions(): Promise<SelectOption[]> {
  const response = await matchingApi.matchMe(3);
  return response.top_matches.map((candidate) => ({
    value: candidate.mentor.id,
    label: candidate.mentor.full_name,
  }));
}

/**
 * ExplainMatchModal — lets the mentee pick from their current top matches
 * and asks the AI to explain that recommendation in plain language
 * (POST /api/v1/ai/explain-match).
 */
export function ExplainMatchModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: ExplainMatchModalProps) {
  const fetchOptions = useCallback(() => fetchMentorOptions(), []);
  const {
    data: options,
    isLoading,
    isError,
    isEmpty,
    error,
    refetch,
  } = useAsyncData(fetchOptions, { immediate: isOpen });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExplainMatchFormValues>({
    resolver: zodResolver(explainMatchSchema),
    defaultValues: { mentor_id: "" },
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expliquer une mise en relation"
      description="Choisissez un mentor recommandé pour comprendre pourquoi il vous a été proposé."
    >
      {isLoading && <LoadingState label="Chargement de vos recommandations…" />}
      {isError && <ErrorState description={error ?? undefined} onRetry={refetch} />}
      {isEmpty && (
        <EmptyState
          icon={<Users2 className="h-5 w-5" />}
          title="Aucune recommandation pour le moment"
          description="Complétez votre profil pour obtenir des recommandations de mentors."
        />
      )}

      {!isLoading && !isError && !isEmpty && options && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Select
            label="Mentor"
            placeholder="Choisissez un mentor"
            options={options}
            error={errors.mentor_id?.message}
            {...register("mentor_id")}
          />
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Expliquer
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
