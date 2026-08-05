import { useCallback, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button, Card, ErrorState, LoadingState } from "@/components/ui";
import { MentorCard, MentorDetailsModal, EmptyMatchingState } from "@/components/mentor";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/hooks/useToast";
import { matchingApi, profilesApi } from "@/api";
import type { MatchCandidate, Profile } from "@/types";

interface EnrichedMatch {
  candidate: MatchCandidate;
  profile: Profile | null;
}

interface MatchingPageData {
  hasProfile: boolean;
  matches: EnrichedMatch[];
}

const TOP_N = 3;

export default function Matching() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const isMentee = user?.role === "mentee";

  const fetchMatches = useCallback(async (): Promise<MatchingPageData> => {
    const [profile, response] = await Promise.all([
      profilesApi.getMineSafe(),
      matchingApi.matchMe(TOP_N),
    ]);

    const matches = await Promise.all(
      response.top_matches.map(async (candidate) => ({
        candidate,
        profile: await profilesApi.getByUserIdSafe(candidate.mentor.id),
      })),
    );

    return { hasProfile: profile !== null, matches };
  }, []);

  const { data, isLoading, isError, error, refetch } = useAsyncData(fetchMatches, {
    immediate: isMentee,
  });

  async function handleRecalculate() {
    try {
      await refetch();
      showToast({ variant: "success", title: "Recommandations mises à jour" });
    } catch {
      // Error already surfaced via ErrorState below.
    }
  }

  if (!isMentee) {
    return (
      <Card padding="lg" className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="inline-flex rounded-full bg-primary-light p-3 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-text">Matching réservé aux mentorées</h2>
        <p className="max-w-sm text-sm text-text-muted">
          Le calcul de compatibilité automatique concerne les mentorées. Les administrateurs peuvent
          lancer un matching pour une mentorée depuis la page Administration.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text">Vos recommandations de mentors</h1>
          <p className="mt-1 text-sm text-text-muted">
            Calculées par notre algorithme déterministe à partir de votre profil.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRecalculate}
          isLoading={isLoading}
        >
          Recalculer
        </Button>
      </div>

      {isLoading && <LoadingState label="Calcul de vos recommandations…" />}

      {isError && (
        <ErrorState
          title="Impossible de calculer vos recommandations"
          description={error ?? undefined}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && data && data.matches.length === 0 && (
        <EmptyMatchingState variant={data.hasProfile ? "no-matches" : "no-profile"} />
      )}

      {!isLoading && !isError && data && data.matches.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.matches.map(({ candidate, profile }) => (
            <MentorCard
              key={candidate.mentor.id}
              mentor={candidate.mentor}
              score={candidate.score}
              explanation={candidate.explanation}
              currentPosition={profile?.current_position}
              entity={profile?.entity}
              themes={profile?.themes}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  Voir le profil
                </Button>
              }
            />
          ))}
        </div>
      )}

      {selectedCandidate && (
        <MentorDetailsModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
