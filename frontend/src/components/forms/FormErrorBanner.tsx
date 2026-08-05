import { AlertCircle } from "lucide-react";

/**
 * FormErrorBanner — reusable component for surfacing a top-level form/API
 * error (e.g. "Invalid email or password") above a form's fields.
 */
export function FormErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-danger/20 bg-danger-light px-3.5 py-3 text-sm text-danger"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
