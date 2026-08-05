import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * SectionCard — MENPS design-system component.
 * Groups related fields under a titled section, used to give long forms
 * (like the Profile questionnaire) a calm, government-form-like structure
 * rather than one undifferentiated wall of inputs.
 */
export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <section
      className={cn("rounded-[var(--radius-card)] border border-border bg-card p-6", className)}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
