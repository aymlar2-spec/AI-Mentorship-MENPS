import { z } from "zod";

/**
 * Profile questionnaire — Zod schema.
 *
 * Field wording, order and required/optional status are taken directly from
 * the original MENPS Google Forms export ("Mentorat Réseau Femmes
 * Éducation") so this form and any future Excel import share the same
 * shape. See PROFILE_QUESTIONS in components/profile/questionnaire.ts for
 * the exact original question text used as field labels.
 *
 * Two fields are stored as Yes/No strings ("Oui" / "Non") rather than
 * booleans at the form layer, matching how the original questionnaire
 * phrases them as a direct question with those two answers; they are
 * converted to booleans when mapped to the API payload (see
 * toProfileApiPayload below).
 */
export const yesNoSchema = z.enum(["Oui", "Non"], {
  message: "Veuillez répondre à cette question",
});

export const profileFormSchema = z.object({
  // Q3 — "Fonction actuelle"
  current_position: z.string().min(1, "Ce champ est obligatoire").max(255),
  // Q4 — "Entité (Direction centrale / AREF / Direction provinciale / Autre)"
  entity: z.string().min(1, "Ce champ est obligatoire").max(255),
  // Q5 — "Numéro de téléphone"
  phone: z.string().min(1, "Ce champ est obligatoire").max(50),
  // Q7 — "Pouvons-nous vous ajouter à un groupe Whatsapp en lien avec le réseau?"
  whatsapp: yesNoSchema,
  // Q8 — "Souhaitez-vous participer à ce dispositif en tant que :"
  // Note: the original form also offers "Pas intéressée à ce stade", which
  // has no equivalent in the backend's MentoringRole enum (mentor / mentee
  // / both) — see Sprint 3 summary for details.
  mentoring_role: z.enum(["mentor", "mentee", "both"], { message: "Veuillez choisir une option" }),
  // Q9 — "Thématiques d'intérêt (en choisir 3 maximum)"
  theme_ids: z
    .array(z.string())
    .min(1, "Choisissez au moins une thématique")
    .max(3, "Choisissez 3 thématiques maximum"),
  // Q10 — "quel type d'engagement vous conviendrait le mieux ?"
  engagement_type: z.enum(["remote", "in_person", "hybrid"], {
    message: "Veuillez choisir une option",
  }),
  // Q11 — "Avez-vous déjà participé à un programme de mentorat dans le passé?"
  previous_mentoring_experience: yesNoSchema,
  // Q12 — motivations (optional in the original form)
  motivations: z.string().max(4000).optional().or(z.literal("")),
  // Q13 — contributions (optional in the original form)
  contributions: z.string().max(4000).optional().or(z.literal("")),
  // Q14 — active engagement (optional in the original form; defaults to Oui)
  active_engagement: yesNoSchema,
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const PROFILE_FORM_DEFAULTS: ProfileFormValues = {
  current_position: "",
  entity: "",
  phone: "",
  whatsapp: "Oui",
  mentoring_role: "mentee",
  theme_ids: [],
  engagement_type: "hybrid",
  previous_mentoring_experience: "Non",
  motivations: "",
  contributions: "",
  active_engagement: "Oui",
};
