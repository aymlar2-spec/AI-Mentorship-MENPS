import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover shadow-sm",
  secondary: "bg-accent-light text-primary hover:bg-accent/20",
  outline: "border border-border-strong text-text bg-transparent hover:bg-black/[0.03]",
  ghost: "bg-transparent text-text hover:bg-black/[0.04]",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

/**
 * Shared class builder so Button (<button>) and ButtonLink (<Link>) render
 * pixel-identical styling from a single source of truth.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}): string {
  return cn(
    "inline-flex items-center justify-center font-medium rounded-[var(--radius-control)]",
    "transition-colors duration-200 ease-out",
    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && "w-full",
    className,
  );
}
