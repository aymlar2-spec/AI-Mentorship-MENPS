import type { Profile, ProfileCreatePayload, ProfileUpdatePayload } from "@/types";
import type { ProfileFormValues } from "@/schemas/profile";

/**
 * Exact wording from the original MENPS Google Forms questionnaire
 * ("Mentorat Réseau Femmes Éducation"), used verbatim as field labels so
 * the on-screen form matches the source-of-truth document the future Excel
 * import will be built against. Do not rephrase these.
 */
export const PROFILE_QUESTIONS = {
  current_position: "Fonction actuelle",
  entity: "Entité (Direction centrale / AREF / Direction provinciale / Autre)",
  phone: "Numéro de téléphone",
  whatsapp: "Pouvons-nous vous ajouter à un groupe Whatsapp en lien avec le réseau ?",
  mentoring_role: "Souhaitez-vous participer à ce dispositif en tant que :",
  themes: "Thématiques d'intérêt (en choisir 3 maximum)",
  engagement_type:
    "Si vous souhaitez participer au mentorat, quel type d'engagement vous conviendrait le mieux ?",
  previous_mentoring_experience:
    "Avez-vous déjà participé à un programme de mentorat dans le passé ?",
  motivations:
    "Pourquoi souhaitez-vous rejoindre ce réseau, et quels sont les besoins prioritaires que vous souhaiteriez adresser grâce à ce réseau ?",
  contributions:
    "Qu'est-ce que vous pourriez apporter concrètement aux autres membres du réseau (expérience, compétences, initiatives, etc.) dans les 6 prochains mois ?",
  active_engagement:
    "Ce réseau repose sur un engagement actif (participation aux rencontres, contribution aux échanges, etc.). Êtes-vous prête à vous engager activement ?",
} as const;

export const YES_NO_OPTIONS = [
  { value: "Oui", label: "Oui" },
  { value: "Non", label: "Non" },
];

/**
 * The original form offers a 4th option, "Pas intéressée à ce stade" (not
 * interested at this stage), which has no equivalent in the backend's
 * MentoringRole enum (mentor / mentee / both — see app/models/profile.py).
 * It is intentionally omitted here rather than sent as an invalid enum
 * value the backend would reject. See Sprint 3 summary for details.
 */
export const MENTORING_ROLE_OPTIONS = [
  { value: "mentor", label: "Mentor" },
  { value: "mentee", label: "Mentorée" },
  { value: "both", label: "Les deux" },
];

/**
 * KNOWN LIMITATION — read before changing:
 * The original questionnaire's engagement question is about TIME
 * COMMITMENT ("Ponctuel" = one-off help vs. "Étendu dans le temps" =
 * ongoing support vs. "Les deux" = either works). The backend's
 * EngagementType enum, however, was modeled around MEETING MODALITY
 * (remote / in_person / hybrid — see app/models/profile.py). These are two
 * different axes that happen to both have 3 options.
 *
 * Per Sprint 3 instructions the backend cannot be modified, so this form
 * displays the ORIGINAL question wording and answer options (preserving
 * questionnaire fidelity for the future Excel import) while storing the
 * answer into the existing enum column positionally. This is a pragmatic,
 * clearly-flagged compromise — see the Sprint 3 summary's "Bugs found"
 * section, which recommends renaming the backend enum in a future sprint
 * (e.g. PUNCTUAL / EXTENDED / BOTH) once the questionnaire is the accepted
 * source of truth.
 */
export const ENGAGEMENT_TYPE_OPTIONS = [
  { value: "remote", label: "Ponctuel (appui ponctuel sur une problématique précise)" },
  { value: "in_person", label: "Étendu dans le temps (accompagnement sur la durée)" },
  { value: "hybrid", label: "Les deux me conviennent" },
];

/** Populate the form when editing an existing profile. */
export function profileToFormValues(profile: Profile): ProfileFormValues {
  return {
    current_position: profile.current_position ?? "",
    entity: profile.entity ?? "",
    phone: profile.phone ?? "",
    whatsapp: profile.whatsapp === "Non" ? "Non" : "Oui",
    mentoring_role: profile.mentoring_role,
    theme_ids: profile.themes.map((t) => t.id),
    engagement_type: profile.engagement_type,
    previous_mentoring_experience: profile.previous_mentoring_experience ? "Oui" : "Non",
    motivations: profile.motivations ?? "",
    contributions: profile.contributions ?? "",
    active_engagement: profile.active_engagement ? "Oui" : "Non",
  };
}

/** Map validated form values to the exact backend ProfileCreatePayload shape. */
export function formValuesToCreatePayload(values: ProfileFormValues): ProfileCreatePayload {
  return {
    current_position: values.current_position,
    entity: values.entity,
    phone: values.phone,
    whatsapp: values.whatsapp,
    mentoring_role: values.mentoring_role,
    engagement_type: values.engagement_type,
    previous_mentoring_experience: values.previous_mentoring_experience === "Oui",
    motivations: values.motivations || null,
    contributions: values.contributions || null,
    active_engagement: values.active_engagement === "Oui",
    theme_ids: values.theme_ids,
  };
}

/** Map validated form values to the backend ProfileUpdatePayload shape (PATCH). */
export function formValuesToUpdatePayload(values: ProfileFormValues): ProfileUpdatePayload {
  const { theme_ids: _themeIds, ...rest } = formValuesToCreatePayload(values);
  return rest;
}
