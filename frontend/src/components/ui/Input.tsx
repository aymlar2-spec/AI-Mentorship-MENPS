import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * Input — MENPS design-system primitive.
 * Radius: 12px. Pairs with React Hook Form via ref forwarding.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, required, ...rest }, ref) => {
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
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={generatedId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={cn(errorId, hintId) || undefined}
            className={cn(
              "w-full h-11 rounded-[var(--radius-control)] border bg-card px-3.5 text-sm text-text",
              "placeholder:text-text-subtle transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent",
              error ? "border-danger" : "border-border-strong",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background",
              className,
            )}
            {...rest}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle">
              {rightIcon}
            </span>
          )}
        </div>
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

Input.displayName = "Input";
