import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MentorDetailsModal } from "@/components/mentor";
import { authApi } from "@/api/auth";
import { themesApi } from "@/api/themes";
import { profilesApi } from "@/api/profiles";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/constants";
import type { MatchCandidate, User } from "@/types";

function makeCandidate(mentor: User): MatchCandidate {
  return { mentor, score: 87, explanation: "Test explanation" };
}

async function registerAdmin() {
  const { token } = await authApi.register({
    full_name: "Contact Test Admin",
    email: `contact-admin-${Date.now()}-${Math.random()}@menps.com`,
    password: "AdminPass123",
    role: "admin",
  });
  return token.access_token;
}

async function registerMentorWithProfile(
  overrides: Partial<{ phone: string; whatsapp: "Oui" | "Non" }> | null,
  themeId?: string,
): Promise<User> {
  const { user, token } = await authApi.register({
    full_name: `Mentor ${Date.now()}`,
    email: `contact-mentor-${Date.now()}-${Math.random()}@menps.com`,
    password: "MentorPass123",
    role: "mentor",
  });

  if (overrides) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.access_token);
    await profilesApi.createMine({
      current_position: "VP",
      entity: "AREF",
      phone: overrides.phone ?? "0600000000",
      whatsapp: overrides.whatsapp ?? "Oui",
      mentoring_role: "mentor",
      engagement_type: "hybrid",
      previous_mentoring_experience: true,
      active_engagement: true,
      theme_ids: themeId ? [themeId] : [],
    });
  }

  return user;
}

describe("Contact Mentor feature — MentorDetailsModal (self-contained fixtures)", () => {
  let fullContactMentor: User;
  let phoneOnlyMentor: User;
  let noProfileMentor: User;
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await registerAdmin();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, adminToken);
    const theme = await themesApi.create({ name: `ContactModalTheme-${Date.now()}` });

    fullContactMentor = await registerMentorWithProfile(
      { phone: "+212 6 12 34 56 78", whatsapp: "Oui" },
      theme.id,
    );
    phoneOnlyMentor = await registerMentorWithProfile({ phone: "0600000002", whatsapp: "Non" }, theme.id);
    noProfileMentor = await registerMentorWithProfile(null);
  }, 20000);

  it("shows Email, Call, and WhatsApp when phone exists and whatsapp='Oui'", async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, adminToken);
    render(<MentorDetailsModal candidate={makeCandidate(fullContactMentor)} onClose={() => {}} />);

    const emailLink = await screen.findByRole("link", { name: /Email/i }, { timeout: 5000 });
    expect(emailLink).toHaveAttribute("href", `mailto:${fullContactMentor.email}`);

    const callLink = screen.getByRole("link", { name: /Appeler/i });
    expect(callLink).toHaveAttribute("href", "tel:+212 6 12 34 56 78");

    const whatsappLink = screen.getByRole("link", { name: /WhatsApp/i });
    expect(whatsappLink).toHaveAttribute("href", "https://wa.me/212612345678");
    expect(whatsappLink).toHaveAttribute("target", "_blank");
  });

  it("shows Email and Call only when whatsapp='Non'", async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, adminToken);
    render(<MentorDetailsModal candidate={makeCandidate(phoneOnlyMentor)} onClose={() => {}} />);

    await screen.findByRole("link", { name: /Email/i }, { timeout: 5000 });
    expect(screen.getByRole("link", { name: /Appeler/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /WhatsApp/i })).not.toBeInTheDocument();
  });

  it("shows Email only when the mentor has no profile (no phone/whatsapp data at all)", async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, adminToken);
    render(<MentorDetailsModal candidate={makeCandidate(noProfileMentor)} onClose={() => {}} />);

    await screen.findByRole("link", { name: /Email/i }, { timeout: 5000 });
    expect(screen.queryByRole("link", { name: /Appeler/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /WhatsApp/i })).not.toBeInTheDocument();
  });
});
