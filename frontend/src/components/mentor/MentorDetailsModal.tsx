import { useCallback } from "react";
import { Briefcase, Building2, Mail, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { Avatar, Badge, ErrorState, LoadingState, Modal } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button-styles";
import { ThemeBadge } from "@/components/profile";
import { CompatibilityBadge } from "./CompatibilityBadge";
import { CompatibilityProgress } from "./CompatibilityProgress";
import { useAsyncData } from "@/hooks/useAsyncData";
import { profilesApi } from "@/api";
import { normalizePhoneForWhatsApp } from "@/lib/phone";
import { cn } from "@/lib/cn";
import type { MatchCandidate, Profile } from "@/types";

export interface MentorDetailsModalProps {
  candidate: MatchCandidate;
  onClose: () => void;
}

/**
 * ContactMentorSection — "Contact this mentor" quick-action row.
 *
 * Only offers an action when the underlying data actually exists — never a
 * disabled button. Uses:
 *   - mentor.email (from the User object, always part of the match
 *     response) for the Email action.
 *   - profile.phone for the Call action.
 *   - profile.phone + profile.whatsapp for the WhatsApp action.
 *
 * NOTE on profile.whatsapp: this field does not store a phone number — it
 * stores the original questionnaire's "Oui"/"Non" answer to "Can we add
 * you to a WhatsApp group?" (see Sprint 3 notes / questionnaire.ts). The
 * actual number used for the wa.me link is profile.phone, gated on the
 * person having answered "Oui". Treating "Oui"/"Non" itself as a phone
 * number would be meaningless.
 */
function ContactMentorSection({
  email,
  profile,
}: {
  email: string;
  profile: Profile | null | undefined;
}) {
  const trimmedEmail = email.trim();
  const trimmedPhone = profile?.phone?.trim();
  const hasPhone = Boolean(trimmedPhone);
  const hasWhatsApp = hasPhone && profile?.whatsapp === "Oui";
  const hasEmail = Boolean(trimmedEmail);

  if (!hasEmail && !hasPhone && !hasWhatsApp) return null;

  const actionClasses = cn(buttonClasses({ variant: "outline", size: "md" }), "w-full sm:w-auto");

  return (
    <div className="border-t border-border pt-4">
      <p className="text-xs font-medium text-text-muted">Contacter ce mentor</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {hasEmail && (
          <a href={`mailto:${trimmedEmail}`} className={actionClasses}>
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Email</span>
          </a>
        )}
        {hasPhone && (
          <a href={`tel:${trimmedPhone}`} className={actionClasses}>
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Appeler</span>
          </a>
        )}
        {hasWhatsApp && trimmedPhone && (
          <a
            href={`https://wa.me/${normalizePhoneForWhatsApp(trimmedPhone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClasses}
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * MentorDetailsModal — MENPS design-system component.
 * Full mentor profile view opened from a MentorCard's "View profile"
 * action, showing the algorithm's compatibility explanation plus (when
 * accessible) the mentor's full questionnaire answers and contact actions.
 *
 * NOTE — profile visibility: GET /api/v1/profiles/{user_id} allows the
 * profile owner, an admin, or a mentee who has an actual computed match
 * with that mentor (see app/routers/profiles.py::_ensure_can_view_profile,
 * relaxed from the original owner/admin-only rule documented in the
 * Sprint 3 summary). Since this modal is only ever opened for a mentor
 * already present in the current top_matches results, a real Matching
 * record exists by the time it's shown — so the "not yet accessible"
 * fallback below is a true edge case, not the common path.
 */
export function MentorDetailsModal({ candidate, onClose }: MentorDetailsModalProps) {
  const { mentor, score, explanation } = candidate;

  const fetchMentorProfile = useCallback(() => profilesApi.getByUserIdSafe(mentor.id), [mentor.id]);
  const { data: profile, isLoading, isError, error, refetch } = useAsyncData(fetchMentorProfile);

  return (
    <Modal isOpen onClose={onClose} size="lg" title="Profil du mentor">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={mentor.full_name} size={56} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text">{mentor.full_name}</p>
            <p className="text-sm text-text-muted">{mentor.email}</p>
          </div>
          <CompatibilityBadge score={score} className="ml-auto shrink-0" />
        </div>

        <CompatibilityProgress score={score} />

        <div>
          <p className="text-xs font-medium text-text-muted">
            Pourquoi ce mentor vous est recommandé
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-text">{explanation}</p>
        </div>

        {!isLoading && !isError && <ContactMentorSection email={mentor.email} profile={profile} />}

        {isLoading && <LoadingState label="Chargement du profil complet…" />}
        {isError && <ErrorState description={error ?? undefined} onRetry={refetch} />}

        {!isLoading && !isError && profile === null && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-border bg-background px-3.5 py-3 text-sm text-text-muted">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Le profil détaillé de ce mentor (fonction, entité, thématiques, motivations) n'est
              pas encore accessible. Il le devient une fois qu'un matching a été calculé entre
              vous et ce mentor.
            </span>
          </div>
        )}

        {!isLoading && !isError && profile && (
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.current_position && (
                <div className="flex items-center gap-2 text-sm text-text">
                  <Briefcase className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                  {profile.current_position}
                </div>
              )}
              {profile.entity && (
                <div className="flex items-center gap-2 text-sm text-text">
                  <Building2 className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                  {profile.entity}
                </div>
              )}
            </div>

            {profile.themes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-muted">Thématiques</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {profile.themes.map((theme) => (
                    <ThemeBadge key={theme.id} label={theme.name} />
                  ))}
                </div>
              </div>
            )}

            {profile.contributions && (
              <div>
                <p className="text-xs font-medium text-text-muted">
                  Ce que ce mentor peut apporter
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text">{profile.contributions}</p>
              </div>
            )}

            {profile.motivations && (
              <div>
                <p className="text-xs font-medium text-text-muted">Motivations</p>
                <p className="mt-1 text-sm leading-relaxed text-text">{profile.motivations}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-text-muted">Expérience de mentorat</p>
              <Badge
                variant={profile.previous_mentoring_experience ? "success" : "neutral"}
                className="mt-1.5"
              >
                {profile.previous_mentoring_experience
                  ? "Expérience préalable"
                  : "Nouvelle au mentorat"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
