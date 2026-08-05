import { apiClient } from "./client";
import type { Theme, ThemeCreatePayload } from "@/types";

/**
 * Theme endpoints — mirrors app/routers/themes.py
 */
export const themesApi = {
  list(): Promise<Theme[]> {
    return apiClient.get<Theme[]>("/api/v1/themes").then((r) => r.data);
  },

  create(payload: ThemeCreatePayload): Promise<Theme> {
    return apiClient.post<Theme>("/api/v1/themes", payload).then((r) => r.data);
  },

  remove(themeId: string): Promise<void> {
    return apiClient.delete(`/api/v1/themes/${themeId}`).then(() => undefined);
  },
};
