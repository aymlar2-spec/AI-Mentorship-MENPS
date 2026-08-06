import { useCallback } from "react";
import { ShieldCheck, Tags, UserCheck, Users2 } from "lucide-react";
import { Card, ErrorState, LoadingState } from "@/components/ui";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usersApi, themesApi } from "@/api";

interface Stats {
  mentors: number;
  mentees: number;
  admins: number;
  themes: number;
}

async function fetchStats(): Promise<Stats> {
  // The backend doesn't expose a count endpoint, so this fetches each role
  // with a generous limit and counts the results — acceptable for a
  // program-sized user base; see Sprint 5 notes if this ever needs to
  // scale beyond a few hundred users per role.
  const [mentors, mentees, admins, themes] = await Promise.all([
    usersApi.list({ role: "mentor", limit: 500 }),
    usersApi.list({ role: "mentee", limit: 500 }),
    usersApi.list({ role: "admin", limit: 500 }),
    themesApi.list(),
  ]);
  return {
    mentors: mentors.length,
    mentees: mentees.length,
    admins: admins.length,
    themes: themes.length,
  };
}

const STAT_CARDS = [
  {
    key: "mentees" as const,
    label: "Mentorées",
    icon: Users2,
    variant: "bg-primary-light text-primary",
  },
  {
    key: "mentors" as const,
    label: "Mentors",
    icon: UserCheck,
    variant: "bg-success-light text-success",
  },
  {
    key: "admins" as const,
    label: "Administrateurs",
    icon: ShieldCheck,
    variant: "bg-info-light text-info",
  },
  {
    key: "themes" as const,
    label: "Thématiques",
    icon: Tags,
    variant: "bg-accent-light text-primary",
  },
];

export function AdminStats() {
  const fetch = useCallback(() => fetchStats(), []);
  const { data, isLoading, isError, error, refetch } = useAsyncData(fetch);

  if (isLoading) return <LoadingState label="Chargement des statistiques…" />;
  if (isError) return <ErrorState description={error ?? undefined} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_CARDS.map(({ key, label, icon: Icon, variant }) => (
        <Card key={key} padding="md" className="flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${variant}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-bold text-text">{data[key]}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
