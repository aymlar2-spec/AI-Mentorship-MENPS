import { apiClient } from "./client";
import type { Conversation, ConversationDetail } from "@/types";

/**
 * Conversation history endpoints — mirrors app/routers/conversations.py
 */
export const conversationsApi = {
  list(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/api/v1/conversations").then((r) => r.data);
  },

  getById(conversationId: string): Promise<ConversationDetail> {
    return apiClient
      .get<ConversationDetail>(`/api/v1/conversations/${conversationId}`)
      .then((r) => r.data);
  },

  remove(conversationId: string): Promise<void> {
    return apiClient.delete(`/api/v1/conversations/${conversationId}`).then(() => undefined);
  },
};
