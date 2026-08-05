import { apiClient } from "./client";
import { ApiError } from "@/types/api";
import type { Profile, ProfileCreatePayload, ProfileUpdatePayload } from "@/types";

/**
 * Profile endpoints — mirrors app/routers/profiles.py
 */
export const profilesApi = {
  createMine(payload: ProfileCreatePayload): Promise<Profile> {
    return apiClient.post<Profile>("/api/v1/profiles/me", payload).then((r) => r.data);
  },

  getMine(): Promise<Profile> {
    return apiClient.get<Profile>("/api/v1/profiles/me").then((r) => r.data);
  },

  /**
   * Same call as getMine(), but resolves to `null` instead of throwing when
   * the backend returns 404 (no profile created yet) — 404 here is a
   * legitimate "empty" business state, not a technical failure, so callers
   * can drive Empty-state UI without treating it as an error.
   */
  async getMineSafe(): Promise<Profile | null> {
    try {
      return await profilesApi.getMine();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  updateMine(payload: ProfileUpdatePayload): Promise<Profile> {
    return apiClient.patch<Profile>("/api/v1/profiles/me", payload).then((r) => r.data);
  },

  deleteMine(): Promise<void> {
    return apiClient.delete("/api/v1/profiles/me").then(() => undefined);
  },

  assignMyThemes(themeIds: string[]): Promise<Profile> {
    return apiClient
      .post<Profile>("/api/v1/profiles/me/themes", { theme_ids: themeIds })
      .then((r) => r.data);
  },

  getByUserId(userId: string): Promise<Profile> {
    return apiClient.get<Profile>(`/api/v1/profiles/${userId}`).then((r) => r.data);
  },

  /**
   * Same call as getByUserId(), but resolves to `null` on 403 instead of
   * throwing. The backend only allows admins or the profile owner to view
   * a profile by user_id (see app/routers/profiles.py::_ensure_self_or_admin),
   * so a mentee viewing a matched mentor's profile will always be denied —
   * this is a known, current backend limitation (see Sprint 3 notes). This
   * helper lets the UI degrade gracefully instead of surfacing an error.
   */
  async getByUserIdSafe(userId: string): Promise<Profile | null> {
    try {
      return await profilesApi.getByUserId(userId);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) return null;
      throw err;
    }
  },
};
