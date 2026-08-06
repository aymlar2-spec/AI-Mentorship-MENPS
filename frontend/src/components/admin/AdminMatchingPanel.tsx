import { useCallback, useState } from "react";
import { Search, Users2 } from "lucide-react";
import { Button, EmptyState, ErrorState, LoadingState, Select } from "@/components/ui";
import { MentorCard } from "@/components/mentor";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/hooks/useToast";
import { matchingApi, profilesApi, usersApi } from "@/api";
import { getErrorMessage } from "@/lib/errors";
import type { MatchCandidate, Profile } from "@/types";

interface EnrichedCandidate {
  candidate: MatchCandidate;
  profile: Profile | null;
}

/**
 * AdminMatchingPanel — lets an administrator trigger the deterministic
 * matching engine for any mentee (POST /api/v1/matching/{mentee_id},
 * admin-only — see app/routers/matching.py). Since admins are exempt from
 * the profile-viewing RBAC restriction (app/routers/profiles.py), results
 * here show full mentor details (position, entity, themes) — unlike the
 * mentee-facing Matching page, which degrades gracefully for that reason.
 */
export function AdminMatchingPanel() {
  const { showToast } = useToast();
  const [selectedMenteeId, setSelectedMenteeId] = useState("");
  const [results, setResults] = useState<EnrichedCandidate[] | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const fetchMentees = useCallback(async () => {
    const mentees = await usersApi.list({ role: "mentee", limit: 100 });
    return mentees.map((m) => ({ value: m.id, label: `${m.full_name} (${m.email})` }));
  }, []);
  const {
    data: menteeOptions,
    isLoading,
    isError,
    isEmpty,
    error,
    refetch,
  } = useAsyncData(fetchMentees);

  async function computeMatches() {
    if (!selectedMenteeId) return;
    setIsComputing(true);
    setResults(null);
    try {
      const response = await matchingApi.matchMentee(selectedMenteeId, 3);
      const enriched = await Promise.all(
        response.top_matches.map(async (candidate) => ({
          candidate,
          profile: await profilesApi.getByUserIdSafe(candidate.mentor.id),
        })),
      );
      setResults(enriched);
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de calculer les correspondances.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsComputing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        Calculez les recommandations de mentors pour une mentorée spécifique.
      </p>

      {isLoading && <LoadingState label="Chargement des mentorées…" />}
      {isError && (
        <ErrorState
          title="Impossible de charger les mentorées"
          description={error ?? undefined}
          onRetry={refetch}
        />
      )}
      {isEmpty && (
        <EmptyState
          icon={<Users2 className="h-5 w-5" />}
          title="Aucune mentorée enregistrée"
          description="Les mentorées apparaîtront ici une fois inscrites."
        />
      )}

      {!isLoading && !isError && !isEmpty && menteeOptions && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Mentorée"
              placeholder="Choisissez une mentorée"
              options={menteeOptions}
              value={selectedMenteeId}
              onChange={(e) => setSelectedMenteeId(e.target.value)}
            />
          </div>
          <Button
            leftIcon={<Search className="h-4 w-4" />}
            disabled={!selectedMenteeId}
            isLoading={isComputing}
            onClick={computeMatches}
          >
            Calculer
          </Button>
        </div>
      )}

      {results && results.length === 0 && (
        <EmptyState
          icon={<Users2 className="h-5 w-5" />}
          title="Aucune correspondance trouvée"
          description="Aucun mentor actif ne correspond au profil de cette mentorée."
        />
      )}

      {results && results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map(({ candidate, profile }) => (
            <MentorCard
              key={candidate.mentor.id}
              mentor={candidate.mentor}
              score={candidate.score}
              explanation={candidate.explanation}
              currentPosition={profile?.current_position}
              entity={profile?.entity}
              themes={profile?.themes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
