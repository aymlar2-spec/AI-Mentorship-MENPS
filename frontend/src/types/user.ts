/**
 * Mirrors backend: app/models/user.py, app/schemas/user.py, app/schemas/auth.py
 */

export type UserRole = "admin" | "mentor" | "mentee";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  is_active?: boolean;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  token: Token;
}
