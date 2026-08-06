import { Target, FileText, ListChecks, Lightbulb, Users2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { UserRole } from "@/types";

export type AITool =
  "smart-goals" | "session-summary" | "action-plan" | "reformulate" | "explain-match";

interface ToolDef {
  id: AITool;
  label: string;
  icon: typeof Target;
  /** Restrict to these roles; omit to show to everyone. */
  roles?: UserRole[];
}

const TOOLS: ToolDef[] = [
  { id: "smart-goals", label: "Objectifs SMART", icon: Target },
  { id: "session-summary", label: "Résumer une séance", icon: FileText },
  { id: "action-plan", label: "Plan d'action", icon: ListChecks },
  // Explain Match relies on the live mentee-only matching endpoint
  // (POST /api/v1/matching/me — see app/routers/matching.py), so it's only
  // offered to mentees.
  { id: "explain-match", label: "Expliquer un match", icon: Users2, roles: ["mentee"] },
  { id: "reformulate", label: "Reformuler un besoin", icon: Lightbulb },
];

/**
 * AIToolsBar — MENPS design-system component.
 * Exposes the specialized coaching tools (app/routers/ai.py) as quick
 * actions above the ChatInput, each opening its own modal.
 */
export function AIToolsBar({
  role,
  onSelect,
  disabled,
}: {
  role: UserRole | undefined;
  onSelect: (tool: AITool) => void;
  disabled?: boolean;
}) {
  const visibleTools = TOOLS.filter((tool) => !tool.roles || (role && tool.roles.includes(role)));

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Outils IA">
      {visibleTools.map((tool) => (
        <Button
          key={tool.id}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          leftIcon={<tool.icon className="h-3.5 w-3.5" />}
          onClick={() => onSelect(tool.id)}
        >
          {tool.label}
        </Button>
      ))}
    </div>
  );
}
