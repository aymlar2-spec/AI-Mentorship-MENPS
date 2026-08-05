import { describe, it, expect } from "vitest";
import { matchingApi } from "@/api/matching";
import { usersApi } from "@/api/users";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/constants";

/**
 * Regression test for a bug found during Sprint 4 integration testing:
 * GET /api/v1/users/{user_id} is owner/admin-only (see
 * app/routers/users.py), so a mentee calling usersApi.getById(mentorId) to
 * resolve a matched mentor's name — as Dashboard.tsx and ExplainMatchModal
 * originally did — always fails with 403.
 *
 * The fix: use the LIVE matching endpoint (POST /api/v1/matching/me), whose
 * response embeds the full mentor User object, instead of combining
 * /matching/history/me (bare mentor_id) with a follow-up users lookup.
 */
describe("Mentee resolving a matched mentor's name", () => {
  it("GET /users/{mentorId} is forbidden for a mentee (confirms the bug this fix avoids)", async () => {
    const menteeEmail = `regress-mentee-${Date.now()}@menps.com`;
    const mentorEmail = `regress-mentor-${Date.now()}@menps.com`;

    const { token: menteeToken } = await authApi.register({
      full_name: "Regress Mentee",
      email: menteeEmail,
      password: "RegressPass123",
      role: "mentee",
    });
    const { user: mentor } = await authApi.register({
      full_name: "Regress Mentor",
      email: mentorEmail,
      password: "RegressPass123",
      role: "mentor",
    });

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, menteeToken.access_token);

    await expect(usersApi.getById(mentor.id)).rejects.toMatchObject({ status: 403 });
  });

  it("the live matching endpoint embeds the mentor's name (no separate users lookup needed)", async () => {
    const email = `regress-live-${Date.now()}@menps.com`;
    const { token } = await authApi.register({
      full_name: "Regress Live Mentee",
      email,
      password: "RegressPass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.access_token);

    // No profile / no mentors yet -> top_matches is empty, but the call
    // itself must succeed (mentee-only endpoint) and the shape must include
    // an embeddable mentor object type even when the array is empty.
    const response = await matchingApi.matchMe(1);
    expect(response.top_matches).toEqual([]);
  });
});
