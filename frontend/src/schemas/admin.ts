import { z } from "zod";

/** Mirrors backend UserUpdate (app/schemas/user.py). */
export const userEditSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(255),
  email: z.string().min(1, "L'email est obligatoire").email("Adresse email invalide"),
  is_active: z.enum(["true", "false"]),
});
export type UserEditFormValues = z.infer<typeof userEditSchema>;

/** Mirrors backend ThemeCreate (app/schemas/theme.py). */
export const themeCreateSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(255),
});
export type ThemeCreateFormValues = z.infer<typeof themeCreateSchema>;
