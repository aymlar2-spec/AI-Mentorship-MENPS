import { Briefcase, Building2, Phone, MessageSquare } from "lucide-react";
import { Badge, SectionCard } from "@/components/ui";
import { ThemeBadge } from "./ThemeBadge";
import {
  MENTORING_ROLE_OPTIONS,
  ENGAGEMENT_TYPE_OPTIONS,
  PROFILE_QUESTIONS,
} from "./questionnaire";
import type { Profile } from "@/types";

function labelFor(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

interface FieldRowProps {
  icon?: typeof Briefcase;
  label: string;
  value: string;
}

function FieldRow({ icon: Icon, label, value }: FieldRowProps) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-text">{value}</p>
      </div>
    </div>
  );
}

/**
 * ProfileSummary — MENPS design-system component.
 * Read-only view of a completed profile, shown before the user switches to
 * edit mode via ProfileForm.
 */
export function ProfileSummary({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Informations professionnelles">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FieldRow
            icon={Briefcase}
            label={PROFILE_QUESTIONS.current_position}
            value={profile.current_position || "—"}
          />
          <FieldRow
            icon={Building2}
            label={PROFILE_QUESTIONS.entity}
            value={profile.entity || "—"}
          />
          <FieldRow icon={Phone} label={PROFILE_QUESTIONS.phone} value={profile.phone || "—"} />
          <FieldRow
            icon={MessageSquare}
            label={PROFILE_QUESTIONS.whatsapp}
            value={profile.whatsapp === "Non" ? "Non" : "Oui"}
          />
        </div>
      </SectionCard>

      <SectionCard title="Votre participation au réseau">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-text-muted">{PROFILE_QUESTIONS.mentoring_role}</p>
            <Badge variant="primary" className="mt-1.5">
              {labelFor(MENTORING_ROLE_OPTIONS, profile.mentoring_role)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-text-muted">{PROFILE_QUESTIONS.themes}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {profile.themes.length > 0 ? (
                profile.themes.map((theme) => <ThemeBadge key={theme.id} label={theme.name} />)
              ) : (
                <span className="text-sm text-text-muted">Aucune thématique sélectionnée</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted">{PROFILE_QUESTIONS.engagement_type}</p>
            <p className="mt-1 text-sm font-medium text-text">
              {labelFor(ENGAGEMENT_TYPE_OPTIONS, profile.engagement_type)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">
              {PROFILE_QUESTIONS.previous_mentoring_experience}
            </p>
            <p className="mt-1 text-sm font-medium text-text">
              {profile.previous_mentoring_experience ? "Oui" : "Non"}
            </p>
          </div>
        </div>
      </SectionCard>

      {(profile.motivations || profile.contributions) && (
        <SectionCard title="Motivations et contributions">
          {profile.motivations && (
            <div>
              <p className="text-xs text-text-muted">{PROFILE_QUESTIONS.motivations}</p>
              <p className="mt-1 text-sm leading-relaxed text-text">{profile.motivations}</p>
            </div>
          )}
          {profile.contributions && (
            <div>
              <p className="text-xs text-text-muted">{PROFILE_QUESTIONS.contributions}</p>
              <p className="mt-1 text-sm leading-relaxed text-text">{profile.contributions}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-text-muted">{PROFILE_QUESTIONS.active_engagement}</p>
            <Badge variant={profile.active_engagement ? "success" : "neutral"} className="mt-1.5">
              {profile.active_engagement ? "Oui" : "Non"}
            </Badge>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
