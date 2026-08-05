import { apiClient } from "./client";
import type { MatchResponse, MatchingRecord } from "@/types";

/**
 * Matching endpoints — mirrors app/routers/matching.py
 * The matching algorithm itself is deterministic and lives entirely in the
 * backend (app/services/matching/engine.py) — the frontend only triggers it
 * and renders the results.
 */
export const matchingApi = {
  matchMe(topN = 3): Promise<MatchResponse> {
    return apiClient
      .post<MatchResponse>("/api/v1/matching/me", null, { params: { top_n: topN } })
      .then((r) => r.data);
  },

  matchMentee(menteeId: string, topN = 3): Promise<MatchResponse> {
    return apiClient
      .post<MatchResponse>(`/api/v1/matching/${menteeId}`, null, { params: { top_n: topN } })
      .then((r) => r.data);
  },

  historyForMe(): Promise<MatchingRecord[]> {
    return apiClient.get<MatchingRecord[]>("/api/v1/matching/history/me").then((r) => r.data);
  },
};
