import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorState,
  LoadingState,
  Select,
} from "@/components/ui";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/api";
import { UserEditModal } from "./UserEditModal";
import { getErrorMessage } from "@/lib/errors";
import type { UserEditFormValues } from "@/schemas/admin";
import type { User, UserRole } from "@/types";

const PAGE_SIZE = 10;

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Tous les rôles" },
  { value: "admin", label: "Administrateurs" },
  { value: "mentor", label: "Mentors" },
  { value: "mentee", label: "Mentorées" },
];

const ROLE_BADGE_VARIANT: Record<UserRole, "primary" | "success" | "neutral"> = {
  admin: "primary",
  mentor: "success",
  mentee: "neutral",
};

export function UsersPanel() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [page, setPage] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(() => {
    return usersApi.list({
      role: roleFilter === "all" ? undefined : roleFilter,
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
  }, [roleFilter, page]);

  const { data: users, isLoading, isError, isEmpty, error, refetch } = useAsyncData(fetchUsers);

  function handleRoleFilterChange(value: string) {
    setRoleFilter(value as UserRole | "all");
    setPage(0);
  }

  async function handleEditSubmit(values: UserEditFormValues) {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await usersApi.update(editingUser.id, {
        full_name: values.full_name,
        email: values.email,
        is_active: values.is_active === "true",
      });
      showToast({ variant: "success", title: "Utilisateur mis à jour" });
      setEditingUser(null);
      await refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de mettre à jour l'utilisateur.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteUser() {
    if (!pendingDeleteUser) return;
    setIsDeleting(true);
    try {
      await usersApi.remove(pendingDeleteUser.id);
      showToast({ variant: "success", title: "Utilisateur supprimé" });
      setPendingDeleteUser(null);
      await refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de supprimer l'utilisateur.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Gérez les comptes mentors, mentorées et administrateurs.
        </p>
        <div className="w-full sm:w-56">
          <Select
            options={ROLE_FILTER_OPTIONS}
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            aria-label="Filtrer par rôle"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Chargement des utilisateurs…" />}
      {isError && (
        <ErrorState
          title="Impossible de charger les utilisateurs"
          description={error ?? undefined}
          onRetry={refetch}
        />
      )}
      {isEmpty && (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Aucun utilisateur trouvé"
          description="Essayez un autre filtre de rôle."
        />
      )}

      {!isLoading && !isError && !isEmpty && users && (
        <>
          <Card padding="none" className="overflow-hidden">
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={u.full_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{u.full_name}</p>
                    <p className="truncate text-xs text-text-muted">{u.email}</p>
                  </div>
                  <Badge
                    variant={ROLE_BADGE_VARIANT[u.role]}
                    className="hidden shrink-0 sm:inline-flex"
                  >
                    {u.role}
                  </Badge>
                  <Badge variant={u.is_active ? "success" : "neutral"} className="shrink-0">
                    {u.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingUser(u)}
                      aria-label={`Modifier ${u.full_name}`}
                      className="rounded-full p-2 text-text-muted transition-colors duration-200 hover:bg-black/[0.05] hover:text-text"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteUser(u)}
                      disabled={u.id === currentUser?.id}
                      aria-label={`Supprimer ${u.full_name}`}
                      className="rounded-full p-2 text-text-muted transition-colors duration-200 hover:bg-danger-light hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Précédent
            </Button>
            <span className="text-xs text-text-muted">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              disabled={users.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </>
      )}

      {editingUser && (
        <UserEditModal
          user={editingUser}
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          isSubmitting={isSubmitting}
          onSubmit={handleEditSubmit}
        />
      )}

      <ConfirmModal
        isOpen={pendingDeleteUser !== null}
        onClose={() => setPendingDeleteUser(null)}
        onConfirm={confirmDeleteUser}
        title="Supprimer cet utilisateur ?"
        description={`Cette action est définitive et supprimera le compte de ${pendingDeleteUser?.full_name ?? ""} ainsi que toutes ses données associées.`}
        confirmLabel="Supprimer"
        isConfirming={isDeleting}
      />
    </div>
  );
}
