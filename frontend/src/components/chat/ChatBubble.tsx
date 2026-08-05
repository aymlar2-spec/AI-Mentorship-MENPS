import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import type { MessageRole } from "@/types";

export interface ChatBubbleProps {
  role: MessageRole;
  content: string;
  createdAt?: string;
  userName?: string;
  /** True while this bubble represents a locally-pending message not yet confirmed by the backend. */
  isPending?: boolean;
  /** True if sending this message failed — shows a retry affordance. */
  hasFailed?: boolean;
  onRetry?: () => void;
}

/**
 * ChatBubble — MENPS design-system component.
 * Renders one message in the AI Chat thread. Assistant messages render as
 * Markdown (ChatGPT-style); user messages render as plain text. System
 * messages are shown as a centered, muted note.
 */
export function ChatBubble({
  role,
  content,
  createdAt,
  userName,
  isPending,
  hasFailed,
  onRetry,
}: ChatBubbleProps) {
  if (role === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-background px-3 py-1 text-xs text-text-muted">
          {content}
        </span>
      </div>
    );
  }

  const isAssistant = role === "assistant";

  return (
    <div className={cn("flex gap-3", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
      )}

      <div
        className={cn("flex max-w-[80%] flex-col gap-1", isAssistant ? "items-start" : "items-end")}
      >
        <div
          className={cn(
            "rounded-[var(--radius-card)] px-4 py-2.5 text-sm leading-relaxed",
            isAssistant ? "bg-card border border-border text-text" : "bg-primary text-white",
            hasFailed && "border border-danger/40 bg-danger-light text-danger",
            isPending && !hasFailed && "opacity-60",
          )}
        >
          {isAssistant ? (
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>

        <div className="flex items-center gap-2 px-1 text-xs text-text-subtle">
          {createdAt && !isPending && (
            <span>
              {new Date(createdAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {hasFailed && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 font-medium text-danger hover:underline"
            >
              <AlertCircle className="h-3 w-3" />
              Échec — réessayer
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {!isAssistant && <Avatar name={userName ?? "?"} size={32} className="mt-0.5 shrink-0" />}
    </div>
  );
}
