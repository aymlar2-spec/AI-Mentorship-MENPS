import type { ReactNode } from "react";
import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { Spinner } from "./Spinner";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

interface StatePanelProps {
  className?: string;
}

/**
 * Loading state — used consistently across every page per requirement #7.
 */
export function LoadingState({
  className,
  label = "Loading…",
}: StatePanelProps & { label?: string }) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}
      role="status"
      aria-live="polite"
    >
      <Spinner size={28} />
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}

/**
 * Empty state — used consistently across every page per requirement #7.
 */
export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
}: StatePanelProps & {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border-strong bg-card/50 py-16 px-6 text-center",
        className,
      )}
    >
      <span className="inline-flex rounded-full bg-primary-light p-3 text-primary">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </span>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Error state — used consistently across every page per requirement #7.
 */
export function ErrorState({
  className,
  title = "Something went wrong",
  description,
  onRetry,
}: StatePanelProps & {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-danger/20 bg-danger-light py-16 px-6 text-center",
        className,
      )}
      role="alert"
    >
      <span className="inline-flex rounded-full bg-danger/10 p-3 text-danger">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
