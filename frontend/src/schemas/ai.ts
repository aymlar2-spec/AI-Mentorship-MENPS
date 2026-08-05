import { z } from "zod";

/**
 * Mirrors backend ChatRequest (app/schemas/conversation.py): { message }.
 */
export const chatMessageSchema = z.object({
  message: z.string().min(1, "Écrivez un message avant d'envoyer"),
});
export type ChatMessageFormValues = z.infer<typeof chatMessageSchema>;

/** Mirrors SmartGoalsRequest: { objective }. */
export const smartGoalsSchema = z.object({
  objective: z.string().min(3, "Décrivez votre objectif (3 caractères minimum)"),
});
export type SmartGoalsFormValues = z.infer<typeof smartGoalsSchema>;

/** Mirrors SessionSummaryRequest: { session_notes }. */
export const sessionSummarySchema = z.object({
  session_notes: z.string().min(3, "Ajoutez quelques notes de séance"),
});
export type SessionSummaryFormValues = z.infer<typeof sessionSummarySchema>;

/** Mirrors ActionPlanRequest: { goal }. */
export const actionPlanSchema = z.object({
  goal: z.string().min(3, "Décrivez l'objectif à atteindre"),
});
export type ActionPlanFormValues = z.infer<typeof actionPlanSchema>;

/** Mirrors ReformulateRequest: { text }. */
export const reformulateSchema = z.object({
  text: z.string().min(3, "Décrivez le besoin à reformuler"),
});
export type ReformulateFormValues = z.infer<typeof reformulateSchema>;

/** Mirrors ExplainMatchRequest: { mentor_id }. */
export const explainMatchSchema = z.object({
  mentor_id: z.string().min(1, "Choisissez un mentor"),
});
export type ExplainMatchFormValues = z.infer<typeof explainMatchSchema>;
