import { MessageCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Conversation } from "@/types";

export interface ConversationListItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

/**
 * ConversationListItem — MENPS design-system component.
 * A single row representing one AI Chat conversation, used on the History
 * page (and reusable for a future conversation sidebar).
 */
export function ConversationListItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: ConversationListItemProps) {
  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3.5 py-3 text-left transition-colors duration-200",
        isActive ? "bg-primary-light" : "hover:bg-black/[0.03]",
      )}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isActive ? "bg-primary text-white" : "bg-primary-light text-primary",
          )}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn("truncate text-sm font-medium", isActive ? "text-primary" : "text-text")}
          >
            {conversation.title ?? "Conversation sans titre"}
          </p>
          <p className="text-xs text-text-muted">
            {new Date(conversation.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer la conversation"
          className="shrink-0 rounded-full p-1.5 text-text-subtle opacity-0 transition-opacity duration-200 hover:bg-danger-light hover:text-danger group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
