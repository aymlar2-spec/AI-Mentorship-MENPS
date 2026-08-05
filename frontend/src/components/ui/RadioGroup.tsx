import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface RadioGroupOption {
  value: string;
  label: string;
}

export interface RadioGroupProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value"
> {
  label?: string;
  error?: string;
  hint?: string;
  options: RadioGroupOption[];
  name: string;
}

/**
 * RadioGroup — MENPS design-system form primitive.
 * Renders a set of native radio inputs styled as a segmented control —
 * reads better than a <Select> for short questionnaire-style Yes/No or
 * 2-4 option questions, while staying fully keyboard/screen-reader
 * accessible and RHF-compatible via standard `register(name)`.
 */
export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  ({ label, error, hint, options, name, required, className, ...rest }, ref) => {
    const reactId = useId();
    const groupId = `${name}-${reactId}`;
    const errorId = error ? `${groupId}-error` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <span id={groupId} className="text-sm font-medium text-text">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </span>
        )}
        <div
          role="radiogroup"
          aria-labelledby={label ? groupId : undefined}
          aria-describedby={errorId}
          aria-invalid={Boolean(error) || undefined}
          className="flex flex-wrap gap-2"
        >
          {options.map((option, index) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-[var(--radius-control)] border px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                "has-checked:border-primary has-checked:bg-primary-light has-checked:text-primary",
                "border-border-strong text-text hover:bg-black/[0.03]",
                "has-focus-visible:outline-2 has-focus-visible:outline-accent has-focus-visible:outline-offset-2",
              )}
            >
              <input
                ref={index === 0 ? ref : undefined}
                type="radio"
                name={name}
                value={option.value}
                className="sr-only"
                {...rest}
              />
              {option.label}
            </label>
          ))}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

RadioGroup.displayName = "RadioGroup";
