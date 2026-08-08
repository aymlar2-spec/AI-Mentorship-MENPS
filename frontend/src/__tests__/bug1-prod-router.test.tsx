import { describe, it, expect, beforeAll } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "@/lib/constants";
import { router } from "@/router";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function createConversationWithMessage(token: string, text: string): Promise<void> {
  try {
    await axios.post(
      `${BASE_URL}/api/v1/ai/chat`,
      { conversation_id: null, message: text },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 4000 },
    );
  } catch {
    // expected timeout — message still persisted server-side
  }
}

describe("Bug 1 repro — EXACT production router (createBrowserRouter + React.lazy)", () => {
  beforeAll(async () => {
    const email = `bug1-prod-${Date.now()}@menps.com`;
    const { user, token } = await authApi.register({
      full_name: "Bug1 Prod",
      email,
      password: "Bug1Pass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.access_token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));

    await createConversationWithMessage(token.access_token, "Message via router de production");
  }, 15000);

  it("loads the existing message via the exact lazy-loaded production router", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>,
    );

    // Navigate using the router's own API (module-level singleton — pushing
    // history before render doesn't affect its already-resolved initial
    // route), exactly like clicking a Sidebar link to /history would.
    router.navigate("/history");

    await waitFor(
      () => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const conversationRow = await screen.findByText(
      /Conversation sans titre/i,
      {},
      { timeout: 5000 },
    );
    await user.click(conversationRow);

    const continueButton = await screen.findByRole("button", { name: /Continuer/i });
    await user.click(continueButton);

    await waitFor(
      () => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText("Message via router de production")).toBeInTheDocument();
    expect(screen.queryByText(/Comment puis-je vous accompagner/i)).not.toBeInTheDocument();
  }, 20000);
});
