/**
 * Mirrors backend: app/models/profile.py, app/schemas/profile.py
 */
import type { Theme } from "./theme";

export type MentoringRole = "mentor" | "mentee" | "both";
export type EngagementType = "remote" | "in_person" | "hybrid";

export interface Profile {
  id: string;
  user_id: string;
  current_position: string | null;
  entity: string | null;
  phone: string | null;
  whatsapp: string | null;
  mentoring_role: MentoringRole;
  engagement_type: EngagementType;
  previous_mentoring_experience: boolean;
  motivations: string | null;
  contributions: string | null;
  active_engagement: boolean;
  themes: Theme[];
}

export interface ProfileCreatePayload {
  current_position?: string | null;
  entity?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  mentoring_role: MentoringRole;
  engagement_type: EngagementType;
  previous_mentoring_experience: boolean;
  motivations?: string | null;
  contributions?: string | null;
  active_engagement: boolean;
  theme_ids?: string[];
}

export type ProfileUpdatePayload = Partial<ProfileCreatePayload>;
