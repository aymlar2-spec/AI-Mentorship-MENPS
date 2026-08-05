/**
 * Mirrors backend: app/models/conversation.py, app/schemas/conversation.py
 */

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface ChatRequestPayload {
  conversation_id?: string | null;
  message: string;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
  messages: Message[];
}

export interface SmartGoalsPayload {
  objective: string;
  conversation_id?: string | null;
}

export interface SessionSummaryPayload {
  session_notes: string;
  conversation_id?: string | null;
}

export interface ActionPlanPayload {
  goal: string;
  conversation_id?: string | null;
}

export interface ExplainMatchPayload {
  mentor_id: string;
  conversation_id?: string | null;
}

export interface ReformulatePayload {
  text: string;
  conversation_id?: string | null;
}
