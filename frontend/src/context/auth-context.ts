import { createContext } from "react";
import type { LoginPayload, RegisterPayload, User } from "@/types";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** True while the initial session is being restored from localStorage. */
  isInitializing: boolean;
  /** True while a login/register request is in flight. */
  isSubmitting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
