import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, RadioGroup } from "@/components/ui";
import { userEditSchema, type UserEditFormValues } from "@/schemas/admin";
import type { User } from "@/types";

export interface UserEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (values: UserEditFormValues) => Promise<void>;
}

const ACTIVE_OPTIONS = [
  { value: "true", label: "Actif" },
  { value: "false", label: "Inactif" },
];

/**
 * UserEditModal — admin-only edit form for a user record.
 * Maps to PATCH /api/v1/users/{user_id} (app/routers/users.py).
 */
export function UserEditModal({
  user,
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: UserEditModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      full_name: user.full_name,
      email: user.email,
      is_active: user.is_active ? "true" : "false",
    },
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier l'utilisateur" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
        <RadioGroup
          label="Statut du compte"
          options={ACTIVE_OPTIONS}
          error={errors.is_active?.message}
          {...register("is_active")}
        />
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
