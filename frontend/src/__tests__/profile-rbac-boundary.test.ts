import { describe, it, expect, beforeAll } from "vitest";
import { profilesApi } from "@/api/profiles";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/constants";

/**
 * Security-boundary regression test for the profile-viewing RBAC relaxation:
 * a mentee can view a MATCHED mentor's profile (see contact-mentor-rbac-fix
 * test), but must NOT be able to view an arbitrary, unmatched mentor's
 * profile. See app/routers/profiles.py::_ensure_can_view_profile.
 */
describe("Profile RBAC — mentee cannot view an unmatched mentor's profile", () => {
  let unmatchedMentorId: string;

  beforeAll(async () => {
    const mentorEmail = `unmatched-boundary-${Date.now()}@menps.com`;
    const { user: mentor } = await authApi.register({
      full_name: "Unmatched Boundary Mentor",
      email: mentorEmail,
      password: "MentorPass123",
      role: "mentor",
    });
    unmatchedMentorId = mentor.id;

    const menteeEmail = `unmatched-boundary-mentee-${Date.now()}@menps.com`;
    const { token } = await authApi.register({
      full_name: "Unmatched Boundary Mentee",
      email: menteeEmail,
      password: "MenteePass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.access_token);
  }, 15000);

  it("rejects with 403 when no Matching record links the mentee and mentor", async () => {
    await expect(profilesApi.getByUserId(unmatchedMentorId)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("getByUserIdSafe() degrades to null (not a throw) for the same case", async () => {
    const result = await profilesApi.getByUserIdSafe(unmatchedMentorId);
    expect(result).toBeNull();
  });
});
