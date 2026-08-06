import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "@/components/profile";
import type { ProfileFormValues } from "@/schemas/profile";

// Mirrors what profileToFormValues() produces when editing an existing
// profile whose saved answers are NOT the first option in their radio
// group — mentoring_role="mentee" (index 1), engagement_type="hybrid"
// (index 2), previous_mentoring_experience="Non" (index 1). This is a very
// common real case (editing any previously-saved profile), not an edge
// case — see Bug 2/3 root cause in BUGFIX_SUMMARY.md.
const EDIT_MODE_DEFAULTS: ProfileFormValues = {
  current_position: "Enseignante",
  entity: "AREF",
  phone: "0600000000",
  whatsapp: "Oui",
  mentoring_role: "mentee",
  theme_ids: ["fake-theme-id"],
  engagement_type: "hybrid",
  previous_mentoring_experience: "Non",
  motivations: "",
  contributions: "",
  active_engagement: "Oui",
};

describe("Bug 3 root cause — pre-filled non-first radio defaults must not cause phantom errors/focus jumps", () => {
  it("submits cleanly with untouched non-first-option defaults, focus stays on the submit flow (no cascade to an unrelated field)", async () => {
    const user = userEvent.setup();
    let submitted = false;

    render(
      <ProfileForm
        defaultValues={EDIT_MODE_DEFAULTS}
        onSubmit={async () => {
          submitted = true;
        }}
        isSubmitting={false}
        submitLabel="Enregistrer"
      />,
    );

    // Do NOT touch any radio button — submit exactly as pre-filled, the way
    // a user editing an existing profile would if they only meant to change
    // a text field.
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => {
      // BUG: previously, mentoring_role/engagement_type/previous_mentoring_experience
      // (none of which default to their first option) would show phantom
      // errors here even though they were never touched.
      expect(screen.queryByText(/Veuillez choisir une option/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Veuillez répondre à cette question/i)).not.toBeInTheDocument();
    });

    expect(submitted).toBe(true);
  }, 15000);
});
