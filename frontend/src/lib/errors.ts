import { ApiError } from "@/types/api";

/**
 * Extracts a human-readable message from a caught error, preferring the
 * backend's own `detail` (already normalized to a string by the Axios
 * interceptor — see api/client.ts) and falling back to a caller-supplied
 * message otherwise. Centralizes a pattern that was previously duplicated
 * across nearly every page/component with a try/catch around an API call.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.detail : fallback;
}
