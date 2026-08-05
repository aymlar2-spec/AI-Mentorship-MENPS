import { useCallback } from "react";
import { Briefcase, Building2, ShieldAlert } from "lucide-react";
import { Avatar, Badge, ErrorState, LoadingState, Modal } from "@/components/ui";
import { ThemeBadge } from "@/components/profile";
import { CompatibilityBadge } from "./CompatibilityBadge";
import { CompatibilityProgress } from "./CompatibilityProgress";
import { useAsyncData } from "@/hooks/useAsyncData";
import { profilesApi } from "@/api";
import type { MatchCandidate } from "@/types";

export interface MentorDetailsModalProps {
  candidate: MatchCandidate;
  onClose: () => void;
}

/**
 * MentorDetailsModal — MENPS design-system component.
 * Full mentor profile view opened from a MentorCard's "View profile"
 * action, showing the algorithm's compatibility explanation plus (when
 * accessible) the mentor's full questionnaire answers.
 *
 * NOTE — known backend limitation: GET /api/v1/profiles/{user_id} only
 * allows the profile owner or an admin (see
 * app/routers/profiles.py::_ensure_self_or_admin). A mentee viewing a
 * matched mentor's profile will always receive a 403 today. This modal
 * degrades gracefully in that case rather than showing an error — see the
 * Sprint 3 summary for a recommended backend fix.
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

        {isLoading && <LoadingState label="Chargement du profil complet…" />}
        {isError && <ErrorState description={error ?? undefined} onRetry={refetch} />}

        {!isLoading && !isError && profile === null && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-border bg-background px-3.5 py-3 text-sm text-text-muted">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Le profil détaillé de ce mentor (fonction, entité, thématiques, motivations) n'est
              visible que par un administrateur pour le moment.
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
