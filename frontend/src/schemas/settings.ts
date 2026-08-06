import { z } from "zod";

/** Mirrors backend UserUpdate (app/schemas/user.py), self-edit subset. */
export const accountSettingsSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(255),
  email: z.string().min(1, "L'email est obligatoire").email("Adresse email invalide"),
});
export type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>;
