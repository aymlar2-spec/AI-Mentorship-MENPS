import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle, Trash2 } from "lucide-react";
import { Button, Card, ConfirmModal, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { ChatBubble, ConversationListItem } from "@/components/chat";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { conversationsApi } from "@/api";
import { getErrorMessage } from "@/lib/errors";
import type { ConversationDetail } from "@/types";

export default function History() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchConversations = useCallback(() => conversationsApi.list(), []);
  const {
    data: conversations,
    isLoading,
    isError,
    isEmpty,
    error,
    refetch,
  } = useAsyncData(fetchConversations);

  async function openConversation(id: string) {
    setSelectedId(id);
    setIsDetailLoading(true);
    try {
      const result = await conversationsApi.getById(id);
      setDetail(result);
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de charger la conversation.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await conversationsApi.remove(pendingDeleteId);
      showToast({ variant: "success", title: "Conversation supprimée" });
      if (selectedId === pendingDeleteId) {
        setSelectedId(null);
        setDetail(null);
      }
      await refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de supprimer la conversation.");
      showToast({ variant: "error", title: "Erreur", description: message });
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Historique des conversations</h1>
        <p className="mt-1 text-sm text-text-muted">
          Retrouvez vos échanges passés avec l'assistant IA.
        </p>
      </div>

      {isLoading && <LoadingState label="Chargement de l'historique…" />}
      {isError && (
        <ErrorState
          title="Impossible de charger l'historique"
          description={error ?? undefined}
          onRetry={refetch}
        />
      )}
      {isEmpty && (
        <EmptyState
          icon={<MessageCircle className="h-5 w-5" />}
          title="Aucune conversation pour le moment"
          description="Démarrez une conversation avec l'assistant IA pour la retrouver ici."
          action={
            <Button size="sm" onClick={() => navigate("/chat")}>
              Ouvrir l'assistant IA
            </Button>
          }
        />
      )}

      {!isLoading && !isError && !isEmpty && conversations && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <Card
            padding="sm"
            className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto scrollbar-thin"
          >
            {conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === selectedId}
                onClick={() => openConversation(conversation.id)}
                onDelete={() => setPendingDeleteId(conversation.id)}
              />
            ))}
          </Card>

          <Card padding="md" className="flex max-h-[70vh] flex-col overflow-hidden">
            {!selectedId && (
              <EmptyState
                icon={<MessageCircle className="h-5 w-5" />}
                title="Sélectionnez une conversation"
                description="Choisissez une conversation dans la liste pour en voir le détail."
              />
            )}

            {selectedId && isDetailLoading && <LoadingState label="Chargement…" />}

            {selectedId && !isDetailLoading && detail && (
              <>
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">
                      {detail.title ?? "Conversation sans titre"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(detail.created_at).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => setPendingDeleteId(detail.id)}
                    >
                      Supprimer
                    </Button>
                    <Button
                      size="sm"
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      onClick={() => navigate(`/chat?conversationId=${detail.id}`)}
                    >
                      Continuer
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {detail.messages.length === 0 ? (
                    <EmptyState
                      icon={<MessageCircle className="h-5 w-5" />}
                      title="Conversation vide"
                      description="Cette conversation ne contient pas encore de message."
                    />
                  ) : (
                    <div className="flex flex-col gap-4 pb-2">
                      {detail.messages.map((m) => (
                        <ChatBubble
                          key={m.id}
                          role={m.role}
                          content={m.content}
                          createdAt={m.created_at}
                          userName={user?.full_name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Supprimer la conversation ?"
        description="Cette action est définitive et supprimera tous les messages associés."
        confirmLabel="Supprimer"
        isConfirming={isDeleting}
      />
    </div>
  );
}
