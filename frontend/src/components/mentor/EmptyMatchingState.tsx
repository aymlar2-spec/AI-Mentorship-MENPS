import { Users2, UserCircle } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";

/**
 * EmptyMatchingState — MENPS design-system component.
 * Two flavors: "no-profile" (mentee hasn't completed the questionnaire yet,
 * so the matching engine has nothing to work with) and "no-matches" (a
 * profile exists but the engine found no eligible mentors — e.g. no active
 * mentors in the program yet).
 */
export function EmptyMatchingState({ variant }: { variant: "no-profile" | "no-matches" }) {
  if (variant === "no-profile") {
    return (
      <EmptyState
        icon={<UserCircle className="h-5 w-5" />}
        title="Complétez votre profil pour être mise en relation"
        description="Le moteur de matching a besoin de votre questionnaire pour calculer vos recommandations de mentors."
        action={<ButtonLink to="/profile">Compléter mon profil</ButtonLink>}
      />
    );
  }

  return (
    <EmptyState
      icon={<Users2 className="h-5 w-5" />}
      title="Aucun mentor disponible pour le moment"
      description="Aucun mentor actif ne correspond à votre profil actuellement. Revenez bientôt."
    />
  );
}
