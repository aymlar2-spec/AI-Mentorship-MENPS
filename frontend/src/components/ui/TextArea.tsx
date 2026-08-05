import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * TextArea — MENPS design-system primitive. Same visual language as Input.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className, id, required, rows = 4, ...rest }, ref) => {
    const reactId = useId();
    const generatedId = id ?? reactId;
    const errorId = error ? `${generatedId}-error` : undefined;
    const hintId = hint ? `${generatedId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={generatedId} className="text-sm font-medium text-text">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={generatedId}
          rows={rows}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={cn(errorId, hintId) || undefined}
          className={cn(
            "w-full rounded-[var(--radius-control)] border bg-card px-3.5 py-2.5 text-sm text-text",
            "placeholder:text-text-subtle transition-colors duration-200 resize-y",
            "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent",
            error ? "border-danger" : "border-border-strong",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background",
            className,
          )}
          {...rest}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
