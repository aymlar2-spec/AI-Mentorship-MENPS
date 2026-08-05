import { Construction } from "lucide-react";
import { Card } from "@/components/ui";

/**
 * Temporary placeholder used for pages scheduled in a later sprint.
 * Keeps routing fully wired and testable in Sprint 1 without
 * pre-building page content out of order.
 */
export function PagePlaceholder({ title, sprint }: { title: string; sprint: string }) {
  return (
    <Card padding="lg" className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="inline-flex rounded-full bg-primary-light p-3 text-primary">
        <Construction className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="max-w-sm text-sm text-text-muted">
        This page will be implemented in {sprint}. The route, layout, and navigation are already
        wired up.
      </p>
    </Card>
  );
}
