import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Save, SettingsIcon, Trash2 } from "lucide-react";
import { Button, Card, ConfirmModal, Input, SectionCard } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { usersApi, profilesApi } from "@/api";
import { getErrorMessage } from "@/lib/errors";
import { accountSettingsSchema, type AccountSettingsFormValues } from "@/schemas/settings";

export default function Settings() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteProfileOpen, setIsDeleteProfileOpen] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: { full_name: user?.full_name ?? "", email: user?.email ?? "" },
  });

  async function handleSave(values: AccountSettingsFormValues) {
    if (!user) return;
    setIsSaving(true);
    try {
      await usersApi.update(user.id, values);
      showToast({ variant: "success", title: "Informations mises à jour" });
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de mettre à jour vos informations.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteProfile() {
    setIsDeletingProfile(true);
    try {
      await profilesApi.deleteMine();
      showToast({
        variant: "success",
        title: "Profil supprimé",
        description: "Votre questionnaire a été supprimé. Vous pouvez le recréer à tout moment.",
      });
      setIsDeleteProfileOpen(false);
      navigate("/profile");
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de supprimer votre profil.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsDeletingProfile(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card padding="md" className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
          <SettingsIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-text">Paramètres</h1>
          <p className="mt-1 text-sm text-text-muted">
            Gérez les informations de votre compte MENPS.
          </p>
        </div>
      </Card>

      <SectionCard
        title="Informations du compte"
        description="Ces informations sont visibles par l'équipe du programme."
      >
        <form onSubmit={handleSubmit(handleSave)} noValidate className="flex flex-col gap-4">
          <Input
            label="Nom complet"
            required
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input
            label="Email"
            type="email"
            required
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-muted">
              Rôle : <span className="font-medium capitalize text-text">{user.role}</span>
            </p>
            <Button
              type="submit"
              leftIcon={<Save className="h-4 w-4" />}
              isLoading={isSaving}
              disabled={!isDirty}
              className="self-start sm:self-auto"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Zone de danger" description="Ces actions sont irréversibles.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text">Supprimer mon profil de mentorat</p>
              <p className="text-xs text-text-muted">
                Votre questionnaire (thématiques, motivations, etc.) sera supprimé. Votre compte
                reste actif.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setIsDeleteProfileOpen(true)}
            className="self-start sm:self-auto"
          >
            Supprimer mon profil
          </Button>
        </div>
        <div className="border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={logout}>
            Se déconnecter
          </Button>
        </div>
      </SectionCard>

      <ConfirmModal
        isOpen={isDeleteProfileOpen}
        onClose={() => setIsDeleteProfileOpen(false)}
        onConfirm={confirmDeleteProfile}
        title="Supprimer votre profil ?"
        description="Votre questionnaire de mentorat sera définitivement supprimé. Vous pourrez en recréer un nouveau à tout moment."
        confirmLabel="Supprimer mon profil"
        isConfirming={isDeletingProfile}
      />
    </div>
  );
}
