import { describe, it, expect, beforeAll } from "vitest";
import { profilesApi } from "@/api/profiles";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/constants";

/**
 * Regression test for a bug reported during Sprint 3 review: a fresh user's
 * GET /api/v1/profiles/me correctly 404s on the backend ("Profile not found
 * for this user"), and the frontend must treat this as the normal
 * first-time-user flow, not an error.
 *
 * These tests exercise the real api/profiles.ts module (not a mock) against
 * a live backend instance, through Vite's actual transform pipeline
 * (Vitest), so they faithfully reflect what ships to the browser.
 */
describe("profilesApi — 404 is treated as 'no profile yet', not an error", () => {
  beforeAll(async () => {
    const email = `profile-empty-${Date.now()}@menps.com`;
    const { token } = await authApi.register({
      full_name: "Fresh User",
      email,
      password: "FreshPass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.access_token);
  });

  it("getMine() throws an ApiError with status 404 for a user with no profile", async () => {
    await expect(profilesApi.getMine()).rejects.toMatchObject({ status: 404 });
  });

  it("getMineSafe() resolves to null (not a throw) for the same 404 case", async () => {
    const result = await profilesApi.getMineSafe();
    expect(result).toBeNull();
  });
});
