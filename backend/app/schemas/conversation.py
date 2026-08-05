"""
Pydantic schemas for Conversation and Message.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.conversation import MessageRole


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: MessageRole
    content: str
    created_at: datetime


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str | None = None
    created_at: datetime


class ConversationDetailOut(ConversationOut):
    messages: list[MessageOut] = []


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    messages: list[MessageOut]


class SmartGoalsRequest(BaseModel):
    objective: str
    conversation_id: str | None = None


class SessionSummaryRequest(BaseModel):
    session_notes: str
    conversation_id: str | None = None


class ActionPlanRequest(BaseModel):
    goal: str
    conversation_id: str | None = None


class ExplainMatchRequest(BaseModel):
    mentor_id: str
    conversation_id: str | None = None


class ReformulateRequest(BaseModel):
    text: str
    conversation_id: str | None = None
