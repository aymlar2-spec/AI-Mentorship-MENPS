/**
 * Mirrors backend: app/models/matching.py, app/schemas/matching.py
 */
import type { User } from "./user";

export interface MatchCandidate {
  mentor: User;
  score: number;
  explanation: string;
}

export interface MatchResponse {
  mentee_id: string;
  top_matches: MatchCandidate[];
}

export interface MatchingRecord {
  id: string;
  mentor_id: string;
  mentee_id: string;
  score: number;
  explanation: string | null;
  created_at: string;
}
