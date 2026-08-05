import { useCallback, useEffect, useState } from "react";
import type { RequestStatus } from "@/types/api";
import { ApiError } from "@/types/api";

interface UseAsyncDataOptions {
  /** Run the fetcher immediately on mount / when it changes. Default: true. */
  immediate?: boolean;
}

interface UseAsyncDataResult<T> {
  data: T | null;
  status: RequestStatus;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  refetch: () => Promise<void>;
}

/**
 * Standardizes the Loading / Empty / Error / Success lifecycle for any async
 * fetch so pages don't each reimplement it ("Loading, Empty and Error"
 * handling is required on every page). "Empty" is true once a successful
 * fetch resolves to null/undefined or a zero-length array.
 *
 * `fetcher` MUST be memoized by the caller with `useCallback`, listing
 * whatever reactive values it closes over (e.g. an id from route params).
 * Refetching is driven purely by `fetcher`'s identity changing — there is
 * no separate `deps` array, so the hook stays compatible with React's
 * static dependency-array requirement.
 *
 * @example
 * const fetchProfile = useCallback(() => profilesApi.getMine(), []);
 * const { data, isLoading, isError, isEmpty, error, refetch } = useAsyncData(fetchProfile);
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions = {},
): UseAsyncDataResult<T> {
  const { immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<RequestStatus>(immediate ? "loading" : "idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again.";
      setError(message);
      setStatus("error");
    }
  }, [fetcher]);

  useEffect(() => {
    if (!immediate) return;
    // Data fetching on mount/dependency-change is the standard use case for
    // this effect; the resulting setState calls are intentional and scoped
    // to this hook's own local state, not synchronizing external systems.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run();
  }, [immediate, run]);

  const isEmpty =
    status === "success" &&
    (data === null || data === undefined || (Array.isArray(data) && data.length === 0));

  return {
    data,
    status,
    error,
    isLoading: status === "loading",
    isError: status === "error",
    isEmpty,
    refetch: run,
  };
}
