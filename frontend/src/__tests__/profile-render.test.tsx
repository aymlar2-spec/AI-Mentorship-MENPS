import { describe, it, expect, beforeAll } from "vitest";
import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "@/lib/constants";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Profile from "@/pages/Profile";

describe("Profile page — full component render against live backend", () => {
  beforeAll(async () => {
    const email = `repro-render-${Date.now()}@menps.com`;
    const { user, token } = await authApi.register({
      full_name: "Repro Render User",
      email,
      password: "ReproPass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.access_token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  });

  it("shows the create-profile form for a fresh user instead of an error (StrictMode, matching main.tsx)", async () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/profile"]}>
          <AuthProvider>
            <ToastProvider>
              <Profile />
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      </StrictMode>,
    );

    // Wait past loading.
    await waitFor(() => {
      expect(screen.queryByText(/Chargement de votre profil/i)).not.toBeInTheDocument();
    });

    // Should NOT show the error state.
    expect(screen.queryByText(/Impossible de charger votre profil/i)).not.toBeInTheDocument();

    // Should show the create-profile heading.
    expect(screen.getByText(/Complétez votre profil/i)).toBeInTheDocument();
    // Should show the actual questionnaire form (a known field label).
    expect(screen.getByText(/Fonction actuelle/i)).toBeInTheDocument();
  });
});
