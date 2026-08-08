import { describe, it, expect, beforeAll } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "@/lib/constants";
import History from "@/pages/History";

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

describe("Bug 1 repro — History page's own inline preview panel", () => {
  beforeAll(async () => {
    const email = `bug1-inline-${Date.now()}@menps.com`;
    const { user, token: issuedToken } = await authApi.register({
      full_name: "Bug1 Inline",
      email,
      password: "Bug1Pass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, issuedToken.access_token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));

    await createConversationWithMessage(issuedToken.access_token, "Contenu du message historique");
  }, 15000);

  it("shows the existing message in the preview panel after clicking the conversation row", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/history"]}>
        <AuthProvider>
          <ToastProvider>
            <History />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Chargement de l'historique/i)).not.toBeInTheDocument();
    });

    const conversationRow = await screen.findByText(/Conversation sans titre/i);
    await user.click(conversationRow);

    await waitFor(() => {
      expect(screen.getByText("Contenu du message historique")).toBeInTheDocument();
    });

    // Must not show the "empty conversation" placeholder.
    expect(
      screen.queryByText(/Cette conversation ne contient pas encore de message/i),
    ).not.toBeInTheDocument();
  }, 15000);
});
