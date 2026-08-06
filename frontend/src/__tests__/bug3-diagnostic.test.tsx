import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "@/components/profile";
import { PROFILE_FORM_DEFAULTS } from "@/schemas/profile";

describe("Bug 3 diagnostic — scroll/focus behavior when selecting a radio option", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call scrollIntoView or move focus to the submit button on radio selection", async () => {
    const user = userEvent.setup();

    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    render(
      <ProfileForm
        defaultValues={PROFILE_FORM_DEFAULTS}
        onSubmit={async () => {}}
        isSubmitting={false}
        submitLabel="Enregistrer"
      />,
    );

    const submitButton = screen.getByRole("button", { name: /Enregistrer/i });
    const focusSpy = vi.spyOn(submitButton, "focus");

    const menteeRadio = screen.getByRole("radio", { name: "Mentorée" });
    await user.click(menteeRadio);

    expect(scrollSpy).not.toHaveBeenCalled();
    expect(focusSpy).not.toHaveBeenCalled();
  }, 15000);
});
