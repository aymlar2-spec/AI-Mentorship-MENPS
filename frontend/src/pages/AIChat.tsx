import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { Button, Card, ErrorState, LoadingState } from "@/components/ui";
import {
  AIToolModal,
  AIToolsBar,
  ChatBubble,
  ChatInput,
  ExplainMatchModal,
  TypingIndicator,
  type AITool,
} from "@/components/chat";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { aiApi, conversationsApi } from "@/api";
import {
  actionPlanSchema,
  reformulateSchema,
  sessionSummarySchema,
  smartGoalsSchema,
  type ActionPlanFormValues,
  type ExplainMatchFormValues,
  type ReformulateFormValues,
  type SessionSummaryFormValues,
  type SmartGoalsFormValues,
} from "@/schemas/ai";
import { getErrorMessage } from "@/lib/errors";
import type { ChatResponse, Message } from "@/types";

interface DisplayMessage extends Message {
  isPending?: boolean;
  hasFailed?: boolean;
  retry?: () => void;
}

export default function AIChat() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdParam = searchParams.get("conversationId");

  const [conversationId, setConversationId] = useState<string | null>(conversationIdParam);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversation = useCallback(() => {
    if (!conversationIdParam) return Promise.resolve(null);
    return conversationsApi.getById(conversationIdParam);
  }, [conversationIdParam]);

  const {
    data: loadedConversation,
    isLoading,
    isError,
    error,
    refetch,
  } = useAsyncData(fetchConversation, { immediate: Boolean(conversationIdParam) });

  // Sync freshly-loaded conversation data into local (mutable, optimistic-UI
  // friendly) state. This adjusts state during render rather than in a
  // useEffect — React's recommended pattern for "derived state that resets
  // when a prop/query changes" — so there's no extra post-commit render.
  const [syncedConversationId, setSyncedConversationId] = useState<string | null>(null);
  if (loadedConversation && loadedConversation.id !== syncedConversationId) {
    setSyncedConversationId(loadedConversation.id);
    setMessages(loadedConversation.messages);
    setConversationId(loadedConversation.id);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function syncConversationId(id: string) {
    setConversationId(id);
    setSearchParams({ conversationId: id }, { replace: true });
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setSearchParams({}, { replace: true });
  }

  async function runToolCall<T>(
    userSummary: string,
    call: () => Promise<ChatResponse>,
    retryPayload: T,
    retry: (payload: T) => void,
  ) {
    const tempId = `pending-${Date.now()}`;
    const optimisticMessage: DisplayMessage = {
      id: tempId,
      conversation_id: conversationId ?? "",
      role: "user",
      content: userSummary,
      created_at: new Date().toISOString(),
      isPending: true,
    };
    setMessages((current) => [...current, optimisticMessage]);
    setIsSending(true);
    setActiveTool(null);

    try {
      const response = await call();
      setMessages(response.messages);
      if (!conversationId) syncConversationId(response.conversation_id);
    } catch (err) {
      const detail = getErrorMessage(err, "L'assistant n'a pas pu répondre.");
      setMessages((current) =>
        current.map((m) =>
          m.id === tempId
            ? { ...m, isPending: false, hasFailed: true, retry: () => retry(retryPayload) }
            : m,
        ),
      );
      showToast({ variant: "error", title: "Échec de l'envoi", description: detail });
    } finally {
      setIsSending(false);
    }
  }

  function handleSendChat(message: string) {
    runToolCall(
      message,
      () => aiApi.chat({ conversation_id: conversationId, message }),
      message,
      handleSendChat,
    );
  }

  function handleSmartGoals(values: SmartGoalsFormValues) {
    return runToolCall(
      `[Objectifs SMART] ${values.objective}`,
      () => aiApi.smartGoals({ conversation_id: conversationId, objective: values.objective }),
      values,
      handleSmartGoals,
    );
  }

  function handleSessionSummary(values: SessionSummaryFormValues) {
    return runToolCall(
      `[Résumé de séance] ${values.session_notes}`,
      () =>
        aiApi.sessionSummary({
          conversation_id: conversationId,
          session_notes: values.session_notes,
        }),
      values,
      handleSessionSummary,
    );
  }

  function handleActionPlan(values: ActionPlanFormValues) {
    return runToolCall(
      `[Plan d'action] ${values.goal}`,
      () => aiApi.actionPlan({ conversation_id: conversationId, goal: values.goal }),
      values,
      handleActionPlan,
    );
  }

  function handleReformulate(values: ReformulateFormValues) {
    return runToolCall(
      `[Reformulation] ${values.text}`,
      () => aiApi.reformulate({ conversation_id: conversationId, text: values.text }),
      values,
      handleReformulate,
    );
  }

  function handleExplainMatch(values: ExplainMatchFormValues) {
    return runToolCall(
      `[Explication du match] Pourquoi ce mentor m'est-il recommandé ?`,
      () => aiApi.explainMatch({ conversation_id: conversationId, mentor_id: values.mentor_id }),
      values,
      handleExplainMatch,
    );
  }

  return (
    <div className="flex h-full min-h-[32rem] flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text">Assistant IA</h1>
          <p className="text-sm text-text-muted">
            Coaching, objectifs et accompagnement personnalisé.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={startNewConversation}
        >
          Nouvelle conversation
        </Button>
      </div>

      <Card padding="none" className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 md:px-6">
          {isLoading && <LoadingState label="Chargement de la conversation…" />}
          {isError && (
            <ErrorState
              title="Impossible de charger la conversation"
              description={error ?? undefined}
              onRetry={refetch}
            />
          )}

          {!isLoading && !isError && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="inline-flex rounded-full bg-primary-light p-3 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-text">Comment puis-je vous accompagner ?</p>
              <p className="max-w-sm text-sm text-text-muted">
                Posez une question, ou utilisez l'un des outils ci-dessous pour un accompagnement
                structuré.
              </p>
            </div>
          )}

          {!isLoading && !isError && messages.length > 0 && (
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  createdAt={m.created_at}
                  userName={user?.full_name}
                  isPending={m.isPending}
                  hasFailed={m.hasFailed}
                  onRetry={m.retry}
                />
              ))}
              {isSending && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-4 md:px-6">
          <AIToolsBar role={user?.role} onSelect={setActiveTool} disabled={isSending} />
          <ChatInput onSend={handleSendChat} disabled={isSending} />
        </div>
      </Card>

      <AIToolModal
        isOpen={activeTool === "smart-goals"}
        onClose={() => setActiveTool(null)}
        title="Objectifs SMART"
        description="Transformez un objectif en objectifs SMART concrets."
        schema={smartGoalsSchema}
        fieldName="objective"
        defaultValues={{ objective: "" }}
        label="Votre objectif"
        placeholder="Ex. Prendre la parole en public avec plus d'assurance"
        isSubmitting={isSending}
        onSubmit={handleSmartGoals}
      />

      <AIToolModal
        isOpen={activeTool === "session-summary"}
        onClose={() => setActiveTool(null)}
        title="Résumer une séance"
        description="Synthétisez vos notes de séance de mentorat."
        schema={sessionSummarySchema}
        fieldName="session_notes"
        defaultValues={{ session_notes: "" }}
        label="Notes de séance"
        placeholder="Collez ou décrivez vos notes de séance…"
        isSubmitting={isSending}
        onSubmit={handleSessionSummary}
      />

      <AIToolModal
        isOpen={activeTool === "action-plan"}
        onClose={() => setActiveTool(null)}
        title="Plan d'action"
        description="Obtenez un plan d'action concret pour avancer."
        schema={actionPlanSchema}
        fieldName="goal"
        defaultValues={{ goal: "" }}
        label="Votre objectif"
        placeholder="Ex. Obtenir une promotion dans les 12 prochains mois"
        isSubmitting={isSending}
        onSubmit={handleActionPlan}
      />

      <AIToolModal
        isOpen={activeTool === "reformulate"}
        onClose={() => setActiveTool(null)}
        title="Reformuler un besoin"
        description="Clarifiez un besoin ou une question en une formulation plus actionnable."
        schema={reformulateSchema}
        fieldName="text"
        defaultValues={{ text: "" }}
        label="Votre texte"
        placeholder="Décrivez votre besoin ou votre question…"
        isSubmitting={isSending}
        onSubmit={handleReformulate}
      />

      <ExplainMatchModal
        isOpen={activeTool === "explain-match"}
        onClose={() => setActiveTool(null)}
        isSubmitting={isSending}
        onSubmit={handleExplainMatch}
      />
    </div>
  );
}
