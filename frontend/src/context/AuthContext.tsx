import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, registerUnauthorizedHandler, usersApi } from "@/api";
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import type { LoginPayload, RegisterPayload, User } from "@/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

function readStoredUser(): User | null {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistSession = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Force logout globally whenever the Axios client sees a 401.
  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  // On mount, revalidate the stored token against the backend so a stale
  // or revoked token doesn't silently keep the user "logged in" client-side.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setIsInitializing(false);
        return;
      }
      try {
        const freshUser = await usersApi.getMe();
        if (!cancelled) {
          localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(freshUser));
          setUser(freshUser);
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const { user: loggedInUser, token: issuedToken } = await authApi.login(payload);
        persistSession(issuedToken.access_token, loggedInUser);
      } catch (err) {
        const message = getErrorMessage(err, "Unable to sign in. Please try again.");
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const { user: newUser, token: issuedToken } = await authApi.register(payload);
        persistSession(issuedToken.access_token, newUser);
      } catch (err) {
        const message = getErrorMessage(err, "Unable to create your account. Please try again.");
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isInitializing,
      isSubmitting,
      isAuthenticated: Boolean(token && user),
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, token, isInitializing, isSubmitting, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
