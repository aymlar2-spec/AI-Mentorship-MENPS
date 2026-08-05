import { apiClient } from "./client";
import type { User, UserRole, UserUpdatePayload } from "@/types";

/**
 * User endpoints — mirrors app/routers/users.py
 */
export const usersApi = {
  getMe(): Promise<User> {
    return apiClient.get<User>("/api/v1/users/me").then((r) => r.data);
  },

  list(params?: { role?: UserRole; skip?: number; limit?: number }): Promise<User[]> {
    return apiClient.get<User[]>("/api/v1/users", { params }).then((r) => r.data);
  },

  getById(userId: string): Promise<User> {
    return apiClient.get<User>(`/api/v1/users/${userId}`).then((r) => r.data);
  },

  update(userId: string, payload: UserUpdatePayload): Promise<User> {
    return apiClient.patch<User>(`/api/v1/users/${userId}`, payload).then((r) => r.data);
  },

  remove(userId: string): Promise<void> {
    return apiClient.delete(`/api/v1/users/${userId}`).then(() => undefined);
  },
};
