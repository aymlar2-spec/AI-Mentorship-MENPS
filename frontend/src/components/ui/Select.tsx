import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  children?: ReactNode;
}

/**
 * Select — MENPS design-system primitive.
 * Native <select> for full accessibility/keyboard support, custom-styled.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, options, placeholder, className, id, required, children, ...rest },
    ref,
  ) => {
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
          <select
            ref={ref}
            id={generatedId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={cn(errorId, hintId) || undefined}
            defaultValue={rest.defaultValue ?? (placeholder ? "" : undefined)}
            className={cn(
              "w-full h-11 appearance-none rounded-[var(--radius-control)] border bg-card pl-3.5 pr-9 text-sm text-text",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent",
              error ? "border-danger" : "border-border-strong",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background",
              className,
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children ??
              options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
            aria-hidden="true"
          />
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

Select.displayName = "Select";
