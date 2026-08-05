"""
AI Assistant endpoints — professional coaching, SMART goals, session
summaries, action plans, match explanations, and need reformulation.

The AI never computes mentor-mentee matching; see app.services.matching.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.conversation import (
    ChatRequest,
    ChatResponse,
    MessageOut,
    SmartGoalsRequest,
    SessionSummaryRequest,
    ActionPlanRequest,
    ExplainMatchRequest,
    ReformulateRequest,
)
from app.services.ai.ai_service import AIService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Assistant"])


def _to_response(reply: str, conv_id: str, messages) -> ChatResponse:
    return ChatResponse(
        conversation_id=conv_id,
        reply=reply,
        messages=[MessageOut.model_validate(m) for m in messages],
    )


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Free-form Q&A with the AI mentoring coach."""
    reply, conv_id, messages = AIService(db).chat(current_user, payload.conversation_id, payload.message)
    return _to_response(reply, conv_id, messages)


@router.post("/smart-goals", response_model=ChatResponse)
def smart_goals(
    payload: SmartGoalsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate SMART goals from a stated objective."""
    reply, conv_id, messages = AIService(db).generate_smart_goals(
        current_user, payload.conversation_id, payload.objective
    )
    return _to_response(reply, conv_id, messages)


@router.post("/session-summary", response_model=ChatResponse)
def session_summary(
    payload: SessionSummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Summarize mentoring session notes."""
    reply, conv_id, messages = AIService(db).summarize_session(
        current_user, payload.conversation_id, payload.session_notes
    )
    return _to_response(reply, conv_id, messages)


@router.post("/action-plan", response_model=ChatResponse)
def action_plan(
    payload: ActionPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Suggest an action plan to reach a stated goal."""
    reply, conv_id, messages = AIService(db).suggest_action_plan(
        current_user, payload.conversation_id, payload.goal
    )
    return _to_response(reply, conv_id, messages)


@router.post("/explain-match", response_model=ChatResponse)
def explain_match(
    payload: ExplainMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Explain, in natural language, a previously computed mentor match."""
    reply, conv_id, messages = AIService(db).explain_match(
        current_user, payload.conversation_id, payload.mentor_id
    )
    return _to_response(reply, conv_id, messages)


@router.post("/reformulate", response_model=ChatResponse)
def reformulate(
    payload: ReformulateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reformulate a user's stated need or question into a clearer statement."""
    reply, conv_id, messages = AIService(db).reformulate_need(
        current_user, payload.conversation_id, payload.text
    )
    return _to_response(reply, conv_id, messages)
