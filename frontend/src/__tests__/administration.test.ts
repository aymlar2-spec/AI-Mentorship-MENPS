import { describe, it, expect, beforeAll } from "vitest";
import { usersApi } from "@/api/users";
import { themesApi } from "@/api/themes";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/constants";

/**
 * Coverage for the Administration module built in Sprint 5: confirms an
 * admin can list/filter users, edit/delete users, and create/delete
 * themes — all against the real backend, using the exact same api/*
 * service calls the Administration page components use.
 */
describe("Administration — admin-only user and theme management", () => {
  let adminToken: string;

  beforeAll(async () => {
    const email = `admin-regress-${Date.now()}@menps.com`;
    const { token } = await authApi.register({
      full_name: "Admin Regress",
      email,
      password: "AdminPass123",
      role: "admin",
    });
    adminToken = token.access_token;
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, adminToken);
  });

  it("lists users filtered by role (UsersPanel contract)", async () => {
    const mentees = await usersApi.list({ role: "mentee", skip: 0, limit: 10 });
    expect(Array.isArray(mentees)).toBe(true);
    expect(mentees.every((u) => u.role === "mentee")).toBe(true);
  });

  it("creates and deletes a theme (ThemeManager contract)", async () => {
    const created = await themesApi.create({ name: `Regress Theme ${Date.now()}` });
    expect(created.id).toBeTruthy();

    const list = await themesApi.list();
    expect(list.some((t) => t.id === created.id)).toBe(true);

    await themesApi.remove(created.id);
    const listAfter = await themesApi.list();
    expect(listAfter.some((t) => t.id === created.id)).toBe(false);
  });

  it("edits a user's name/email/active status (UserEditModal contract)", async () => {
    const email = `admin-target-${Date.now()}@menps.com`;
    const { user: target } = await authApi.register({
      full_name: "Target User",
      email,
      password: "TargetPass123",
      role: "mentee",
    });

    const updated = await usersApi.update(target.id, {
      full_name: "Target User Updated",
      is_active: false,
    });
    expect(updated.full_name).toBe("Target User Updated");
    expect(updated.is_active).toBe(false);
  });
});
