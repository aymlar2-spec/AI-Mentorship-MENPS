import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users2,
  MessageCircle,
  UserCircle,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui";
import { MentorCard } from "@/components/mentor";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncData } from "@/hooks/useAsyncData";
import { matchingApi, usersApi, conversationsApi } from "@/api";
import type { Conversation, User } from "@/types";

interface MenteeMatchSummary {
  mentor: User;
  score: number;
  explanation: string | null;
}

interface MentorMatchSummary {
  mentee: User;
  score: number;
}

type MatchSummary =
  | { kind: "mentee"; match: MenteeMatchSummary | null }
  | { kind: "mentor"; matches: MentorMatchSummary[] }
  | { kind: "admin" };

export default function Dashboard() {
  const { user } = useAuth();

  const fetchMatchSummary = useCallback(async (): Promise<MatchSummary> => {
    if (!user) return { kind: "admin" };

    if (user.role === "admin") {
      return { kind: "admin" };
    }

    const history = await matchingApi.historyForMe();

    if (user.role === "mentee") {
      const latest = history[0];
      if (!latest) return { kind: "mentee", match: null };
      const mentor = await usersApi.getById(latest.mentor_id);
      return {
        kind: "mentee",
        match: { mentor, score: latest.score, explanation: latest.explanation },
      };
    }

    // mentor: show the most recent mentees that were matched to them.
    const recent = history.slice(0, 3);
    const matches = await Promise.all(
      recent.map(async (record) => ({
        mentee: await usersApi.getById(record.mentee_id),
        score: record.score,
      })),
    );
    return { kind: "mentor", matches };
  }, [user]);

  const fetchConversations = useCallback(
    (): Promise<Conversation[]> => conversationsApi.list(),
    [],
  );

  const matchState = useAsyncData(fetchMatchSummary);
  const conversationsState = useAsyncData(fetchConversations);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <WelcomeHeader userName={user.full_name} role={user.role} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <MatchSection state={matchState} role={user.role} />
          <RecentConversationsSection state={conversationsState} />
        </div>
        <QuickActions role={user.role} />
      </div>
    </div>
  );
}

function WelcomeHeader({ userName, role }: { userName: string; role: User["role"] }) {
  const firstName = userName.split(" ")[0];
  const roleCopy: Record<User["role"], string> = {
    mentee: "Here's where things stand with your mentoring journey.",
    mentor: "Here's a look at the mentees you're supporting.",
    admin: "Here's an overview of the MENPS program.",
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-text">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-text-muted">{roleCopy[role]}</p>
    </div>
  );
}

function MatchSection({
  state,
  role,
}: {
  state: ReturnType<typeof useAsyncData<MatchSummary>>;
  role: User["role"];
}) {
  const { data, isLoading, isError, error, refetch } = state;

  if (role === "admin") return null;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            {role === "mentee" ? "Your mentor recommendation" : "Mentees matched with you"}
          </CardTitle>
          <CardDescription>
            {role === "mentee"
              ? "Based on your profile, computed by the matching engine."
              : "Recently computed compatibility with mentees."}
          </CardDescription>
        </div>
        {role === "mentee" && (
          <Link
            to="/matching"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View all matches
          </Link>
        )}
      </CardHeader>

      {isLoading && <LoadingState label="Loading your match…" />}

      {isError && <ErrorState description={error ?? undefined} onRetry={refetch} />}

      {!isLoading && !isError && data?.kind === "mentee" && (
        <>
          {data.match ? (
            <MentorCard
              mentor={data.match.mentor}
              score={data.match.score}
              explanation={data.match.explanation ?? undefined}
              variant="compact"
            />
          ) : (
            <EmptyState
              icon={<Users2 className="h-5 w-5" />}
              title="No match yet"
              description="Run the matching engine to get your top mentor recommendations."
              action={
                <ButtonLink to="/matching" size="sm">
                  Find my mentor match
                </ButtonLink>
              }
            />
          )}
        </>
      )}

      {!isLoading && !isError && data?.kind === "mentor" && (
        <>
          {data.matches.length === 0 ? (
            <EmptyState
              icon={<Users2 className="h-5 w-5" />}
              title="No mentee matches yet"
              description="Once mentees are matched with you, they'll appear here."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {data.matches.map(({ mentee, score }) => (
                <li key={mentee.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={mentee.full_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{mentee.full_name}</p>
                  </div>
                  <Badge variant="primary">
                    <Sparkles className="h-3 w-3" /> {score.toFixed(0)}%
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

function RecentConversationsSection({
  state,
}: {
  state: ReturnType<typeof useAsyncData<Conversation[]>>;
}) {
  const { data, isLoading, isEmpty, isError, error, refetch } = state;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent conversations</CardTitle>
          <CardDescription>Your latest exchanges with the AI mentoring assistant.</CardDescription>
        </div>
        <Link to="/history" className="shrink-0 text-sm font-medium text-primary hover:underline">
          View history
        </Link>
      </CardHeader>

      {isLoading && <LoadingState label="Loading conversations…" />}

      {isError && <ErrorState description={error ?? undefined} onRetry={refetch} />}

      {isEmpty && (
        <EmptyState
          icon={<MessageCircle className="h-5 w-5" />}
          title="No conversations yet"
          description="Start a conversation with your AI mentoring coach to get personalized guidance."
          action={
            <ButtonLink to="/chat" size="sm">
              Start a conversation
            </ButtonLink>
          }
        />
      )}

      {!isLoading && !isError && !isEmpty && data && (
        <ul className="flex flex-col divide-y divide-border">
          {data.slice(0, 4).map((conversation) => (
            <li key={conversation.id}>
              <Link
                to="/chat"
                className="flex items-center gap-3 py-3 transition-colors duration-200 first:pt-0 last:pb-0 hover:text-primary"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {conversation.title ?? "Untitled conversation"}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {new Date(conversation.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function QuickActions({ role }: { role: User["role"] }) {
  const actions = [
    {
      label: "Open AI Chat",
      to: "/chat",
      icon: MessageCircle,
      roles: ["mentee", "mentor", "admin"],
    },
    {
      label: "View my profile",
      to: "/profile",
      icon: UserCircle,
      roles: ["mentee", "mentor", "admin"],
    },
    { label: "Find my mentor match", to: "/matching", icon: Users2, roles: ["mentee"] },
    { label: "Go to Administration", to: "/admin", icon: ShieldCheck, roles: ["admin"] },
  ].filter((action) => action.roles.includes(role));

  return (
    <Card padding="md" className="h-fit">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-3 rounded-[var(--radius-control)] border border-border px-3.5 py-3 text-sm font-medium text-text transition-colors duration-200 hover:border-primary hover:bg-primary-light hover:text-primary"
          >
            <action.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {action.label}
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
