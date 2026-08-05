import { apiClient } from "./client";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types";

/**
 * Auth endpoints — mirrors app/routers/auth.py
 */
export const authApi = {
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/v1/auth/register", payload).then((r) => r.data);
  },

  login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/v1/auth/login", payload).then((r) => r.data);
  },
};
