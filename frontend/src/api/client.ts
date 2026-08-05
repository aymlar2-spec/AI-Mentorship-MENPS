import axios, { type AxiosError } from "axios";
import { ApiError, type ApiErrorBody } from "@/types/api";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/constants";

/**
 * Single Axios instance for the entire app.
 * Base URL comes from VITE_API_BASE_URL (see .env.example).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Attach the JWT bearer token (if present) to every outgoing request.
 * The backend authenticates via a plain "Authorization: Bearer <token>"
 * header (see app/api/deps.py — HTTPBearer), not the OAuth2 form flow.
 */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Callback the AuthContext registers so the interceptor can force a logout
 * on 401 without importing React context logic into this module.
 */
let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/**
 * Normalize every failure into an ApiError with a human-readable `detail`,
 * matching the backend's { "detail": string } error shape, and trigger a
 * global logout when the token is rejected or expired.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const detail =
      error.response?.data?.detail ??
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : error.message || "Something went wrong. Please try again.");

    if (status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(new ApiError(status, detail));
  },
);
