import { z } from "zod";

/**
 * Mirrors backend LoginRequest (app/schemas/auth.py): { email, password }.
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Mirrors backend UserCreate (app/schemas/user.py): { full_name, email,
 * password, role }. Public sign-up only offers "mentor" / "mentee" — the
 * backend also accepts "admin" but the UI intentionally never exposes it
 * (matches the UI/UX spec, which has no self-serve admin creation flow).
 */
export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Enter your full name").max(255),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.enum(["mentor", "mentee"], { message: "Choose a role" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
