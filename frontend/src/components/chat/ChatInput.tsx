import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui";
import { chatMessageSchema, type ChatMessageFormValues } from "@/schemas/ai";

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * ChatInput — MENPS design-system component.
 * Message composer for the AI Chat page. Enter sends, Shift+Enter inserts
 * a newline. Clears itself immediately on submit (the parent owns the
 * optimistic message state).
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatMessageFormValues>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: { message: "" },
  });

  function submit(values: ChatMessageFormValues) {
    onSend(values.message.trim());
    reset({ message: "" });
  }

  const { ref: messageRef, ...messageField } = register("message");

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <textarea
          {...messageField}
          ref={messageRef}
          rows={1}
          disabled={disabled}
          placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
          aria-label="Message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(submit)();
            }
          }}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-[var(--radius-control)] border border-border-strong bg-card px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" disabled={disabled} aria-label="Envoyer" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {errors.message && (
        <p role="alert" className="px-1 text-xs text-danger">
          {errors.message.message}
        </p>
      )}
    </form>
  );
}
