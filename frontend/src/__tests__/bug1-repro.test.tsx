import { describe, it, expect, beforeAll } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { authApi } from "@/api/auth";
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "@/lib/constants";
import AIChat from "@/pages/AIChat";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

describe("Bug 1 repro — navigating directly to /chat?conversationId=X", () => {
  let conversationId: string;

  beforeAll(async () => {
    const email = `bug1-repro-${Date.now()}@menps.com`;
    const { user, token } = await authApi.register({
      full_name: "Bug1 Repro",
      email,
      password: "Bug1Pass123",
      role: "mentee",
    });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.access_token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));

    // Create a conversation with a real persisted user message. Gemini is
    // unreachable in this environment, so bound the call client-side and
    // accept the timeout — the user's message is still persisted before
    // the AI call fails (confirmed in Sprint 4 testing).
    try {
      await axios.post(
        `${BASE_URL}/api/v1/ai/chat`,
        { conversation_id: null, message: "Message existant pour le test" },
        { headers: { Authorization: `Bearer ${token.access_token}` }, timeout: 4000 },
      );
    } catch {
      // expected timeout
    }

    const list = await axios.get(`${BASE_URL}/api/v1/conversations`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    expect(list.data.length).toBeGreaterThan(0);
    conversationId = list.data[0].id;
  }, 15000);

  it("loads and displays the existing message when navigating to /chat?conversationId=X", async () => {
    const router = createMemoryRouter([{ path: "/chat", element: <AIChat /> }], {
      initialEntries: [`/chat?conversationId=${conversationId}`],
    });

    render(
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>,
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/Chargement de la conversation/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // BUG: this currently fails — the empty-state placeholder shows instead
    // of the existing message.
    expect(screen.getByText("Message existant pour le test")).toBeInTheDocument();
    expect(screen.queryByText(/Comment puis-je vous accompagner/i)).not.toBeInTheDocument();
  }, 15000);
});
