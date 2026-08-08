import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MentorDetailsModal } from "@/components/mentor";
import { authApi } from "@/api/auth";
import { themesApi } from "@/api/themes";
import { profilesApi } from "@/api/profiles";
import { matchingApi } from "@/api/matching";
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "@/lib/constants";
import type { MatchCandidate } from "@/types";

/**
 * Proves the backend RBAC fix: GET /api/v1/profiles/{mentor_id} now
 * succeeds for a MENTEE (not just an admin) when a real Matching record
 * links them to that mentor — see app/routers/profiles.py::_ensure_can_view_profile.
 * Before this fix, a mentee only ever saw the Email contact action.
 */
describe("Contact Mentor — mentee sees Call/WhatsApp for a matched mentor (RBAC fix)", () => {
  let candidate: MatchCandidate;

  beforeAll(async () => {
    // Admin sets up a theme.
    const adminEmail = `rbac-admin-${Date.now()}@menps.com`;
    const { token: adminToken } = await authApi.register({
      full_name: "RBAC Fix Admin",
      email: adminEmail,
      password: "AdminPass123",
      role: "admin",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, adminToken.access_token);
    const theme = await themesApi.create({ name: `RBACFixTheme-${Date.now()}` });

    // Mentor with full contact info.
    const mentorEmail = `rbac-fix-mentor-${Date.now()}@menps.com`;
    const { user: mentor, token: mentorToken } = await authApi.register({
      full_name: "RBAC Fix Mentor",
      email: mentorEmail,
      password: "MentorPass123",
      role: "mentor",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, mentorToken.access_token);
    await profilesApi.createMine({
      current_position: "VP",
      entity: "AREF",
      phone: "+212 6 99 11 22 33",
      whatsapp: "Oui",
      mentoring_role: "mentor",
      engagement_type: "hybrid",
      previous_mentoring_experience: true,
      active_engagement: true,
      theme_ids: [theme.id],
    });

    // Mentee, matched to that mentor.
    const menteeEmail = `rbac-fix-mentee-${Date.now()}@menps.com`;
    const { user: mentee, token: menteeToken } = await authApi.register({
      full_name: "RBAC Fix Mentee",
      email: menteeEmail,
      password: "MenteePass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, menteeToken.access_token);
    await profilesApi.createMine({
      current_position: "Prof",
      entity: "DP",
      phone: "0600000000",
      whatsapp: "Non",
      mentoring_role: "mentee",
      engagement_type: "hybrid",
      previous_mentoring_experience: false,
      active_engagement: true,
      theme_ids: [theme.id],
    });

    const matchResponse = await matchingApi.matchMe(1);
    expect(matchResponse.top_matches[0]?.mentor.id).toBe(mentor.id);
    candidate = matchResponse.top_matches[0];

    // Stay logged in as the MENTEE (not admin) for the actual test render.
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, menteeToken.access_token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(mentee));
  }, 20000);

  it("shows Email, Call, and WhatsApp — not just Email — when the current user is the matched mentee", async () => {
    render(<MentorDetailsModal candidate={candidate} onClose={() => {}} />);

    const emailLink = await screen.findByRole("link", { name: /Email/i }, { timeout: 5000 });
    expect(emailLink).toBeInTheDocument();

    const callLink = await screen.findByRole("link", { name: /Appeler/i }, { timeout: 5000 });
    expect(callLink).toHaveAttribute("href", "tel:+212 6 99 11 22 33");

    const whatsappLink = screen.getByRole("link", { name: /WhatsApp/i });
    expect(whatsappLink).toHaveAttribute("href", "https://wa.me/212699112233");
  }, 20000);
});
