import { Sparkles } from "lucide-react";

/**
 * TypingIndicator — MENPS design-system component.
 * Shown in the chat thread while an AI reply is in flight.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3" role="status" aria-label="L'assistant écrit…">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="flex items-center gap-1 rounded-[var(--radius-card)] border border-border bg-card px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-text-subtle"
            style={{
              animation: "typing-dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
