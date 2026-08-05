import { apiClient } from "./client";
import type {
  ActionPlanPayload,
  ChatRequestPayload,
  ChatResponse,
  ExplainMatchPayload,
  ReformulatePayload,
  SessionSummaryPayload,
  SmartGoalsPayload,
} from "@/types";

/**
 * AI Assistant endpoints — mirrors app/routers/ai.py
 * The AI never computes matching; it only assists with coaching, framed
 * around the profile context the backend attaches server-side.
 */
export const aiApi = {
  chat(payload: ChatRequestPayload): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>("/api/v1/ai/chat", payload).then((r) => r.data);
  },

  smartGoals(payload: SmartGoalsPayload): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>("/api/v1/ai/smart-goals", payload).then((r) => r.data);
  },

  sessionSummary(payload: SessionSummaryPayload): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>("/api/v1/ai/session-summary", payload).then((r) => r.data);
  },

  actionPlan(payload: ActionPlanPayload): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>("/api/v1/ai/action-plan", payload).then((r) => r.data);
  },

  explainMatch(payload: ExplainMatchPayload): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>("/api/v1/ai/explain-match", payload).then((r) => r.data);
  },

  reformulate(payload: ReformulatePayload): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>("/api/v1/ai/reformulate", payload).then((r) => r.data);
  },
};
