export type CompatibilityVariant = "success" | "primary" | "warning";

/** Maps a 0-100 compatibility score to a semantic display variant. */
export function compatibilityVariant(score: number): CompatibilityVariant {
  if (score >= 70) return "success";
  if (score >= 40) return "primary";
  return "warning";
}
