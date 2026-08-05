import { useCallback, useState } from "react";
import { Pencil, UserCircle } from "lucide-react";
import { Button, Card, ErrorState, LoadingState } from "@/components/ui";
import {
  ProfileForm,
  ProfileSummary,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
  profileToFormValues,
} from "@/components/profile";
import { PROFILE_FORM_DEFAULTS, type ProfileFormValues } from "@/schemas/profile";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/hooks/useToast";
import { profilesApi } from "@/api";
import { ApiError } from "@/types/api";

type ViewMode = "view" | "edit";

export default function Profile() {
  const [mode, setMode] = useState<ViewMode>("view");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchProfile = useCallback(() => profilesApi.getMineSafe(), []);
  const { data: profile, isLoading, isError, isEmpty, error, refetch } = useAsyncData(fetchProfile);

  // profilesApi.getMineSafe() calls GET /api/v1/profiles/me and treats a 404
  // ("Profile not found for this user") as the expected first-time-user
  // state — it resolves to `null` instead of throwing (see api/profiles.ts).
  // useAsyncData then reports that as isEmpty=true, NOT isError=true. A 404
  // here must never reach the isError branch below; see
  // src/__tests__/profile-empty-state.test.ts and profile-render.test.tsx
  // for regression coverage of exactly this behavior.
  const hasNoProfileYet = isEmpty || profile === null;

  async function handleCreate(values: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      await profilesApi.createMine(formValuesToCreatePayload(values));
      showToast({
        variant: "success",
        title: "Profil créé",
        description: "Votre questionnaire a bien été enregistré.",
      });
      await refetch();
      setMode("view");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : "Impossible de créer votre profil. Réessayez.";
      showToast({ variant: "error", title: "Échec de la création", description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(values: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      await profilesApi.updateMine(formValuesToUpdatePayload(values));
      await profilesApi.assignMyThemes(values.theme_ids);
      showToast({
        variant: "success",
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées.",
      });
      await refetch();
      setMode("view");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : "Impossible de mettre à jour votre profil. Réessayez.";
      showToast({ variant: "error", title: "Échec de la mise à jour", description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Chargement de votre profil…" className="min-h-[50vh]" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger votre profil"
        description={error ?? undefined}
        onRetry={refetch}
      />
    );
  }

  // No profile yet (backend 404'd on GET /profiles/me) — the Empty state IS
  // the create form: the correct action for a first-time user is filling
  // out the questionnaire, submitted via POST /api/v1/profiles/me below.
  if (hasNoProfileYet) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Complétez votre profil"
          description="Ce questionnaire nous permet de mieux vous connaître et de vous proposer des mises en relation pertinentes."
        />
        <ProfileForm
          defaultValues={PROFILE_FORM_DEFAULTS}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          submitLabel="Enregistrer mon profil"
        />
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Modifier mon profil"
          description="Mettez à jour vos informations à tout moment."
        />
        <ProfileForm
          defaultValues={profileToFormValues(profile)}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
          submitLabel="Enregistrer les modifications"
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Mon profil"
          description="Voici les informations que vous avez partagées avec le réseau MENPS."
        />
        <Button
          variant="outline"
          leftIcon={<Pencil className="h-4 w-4" />}
          onClick={() => setMode("edit")}
        >
          Modifier
        </Button>
      </div>
      <ProfileSummary profile={profile} />
    </div>
  );
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <Card padding="md" className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
        <UserCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-text">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
    </Card>
  );
}
