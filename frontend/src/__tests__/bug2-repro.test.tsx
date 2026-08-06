import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "@/components/profile";
import { PROFILE_FORM_DEFAULTS } from "@/schemas/profile";

describe("Bug 2 repro — RadioGroup only accepted the first option", () => {
  it("accepts every non-first option across all radio questions without a false validation error", async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        defaultValues={PROFILE_FORM_DEFAULTS}
        onSubmit={async () => {}}
        isSubmitting={false}
        submitLabel="Enregistrer"
      />,
    );

    // Select the SECOND/non-default option in every radio-based question.
    const menteeRadio = screen.getByRole("radio", { name: "Mentorée" });
    await user.click(menteeRadio);
    expect(menteeRadio).toBeChecked();

    const nonRadio = screen.getAllByRole("radio", { name: "Non" });
    // whatsapp defaults to "Oui" -> flip to "Non"
    await user.click(nonRadio[0]);
    expect(nonRadio[0]).toBeChecked();

    const longTermRadio = screen.getByRole("radio", { name: /Étendu dans le temps/i });
    await user.click(longTermRadio);
    expect(longTermRadio).toBeChecked();

    const ouiRadio = screen.getAllByRole("radio", { name: "Oui" });
    // previous_mentoring_experience defaults to "Non" -> flip to "Oui"
    await user.click(ouiRadio[0]);
    expect(ouiRadio[0]).toBeChecked();

    // Submit to trigger validation, then confirm NONE of the radio-group
    // error messages appear (theme_ids will still legitimately error since
    // no theme was selected — that's out of scope for this bug).
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Choisissez au moins une thématique/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Veuillez choisir une option/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Veuillez répondre à cette question/i)).not.toBeInTheDocument();
  }, 15000);
});
