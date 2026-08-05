import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/hooks/useToast";
import type { ToastItem, ToastVariant } from "@/context/toast-context";

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: "border-success/30 bg-success-light text-success" },
  error: { icon: AlertCircle, classes: "border-danger/30 bg-danger-light text-danger" },
  warning: { icon: AlertTriangle, classes: "border-warning/30 bg-warning-light text-warning" },
  info: { icon: Info, classes: "border-info/30 bg-info-light text-info" },
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const { icon: Icon, classes } = VARIANT_STYLES[toast.variant];

  return (
    <div
      role="status"
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-control)] border bg-card px-4 py-3 shadow-lg",
        "animate-[toast-in_200ms_ease-out]",
      )}
    >
      <span className={cn("mt-0.5 inline-flex shrink-0 rounded-full p-1", classes)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-full p-1 text-text-subtle transition-colors duration-200 hover:bg-black/[0.05] hover:text-text"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Fixed-position stack rendering every active toast. Mount once near the app root. */
export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
