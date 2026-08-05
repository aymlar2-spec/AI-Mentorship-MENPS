"""
Conversation history endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.conversation import ConversationOut, ConversationDetailOut
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/api/v1/conversations", tags=["Conversations"])


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all conversations belonging to the current user."""
    return ConversationService(db).list_conversations(current_user.id)


@router.get("/{conversation_id}", response_model=ConversationDetailOut)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a conversation and its full message history."""
    return ConversationService(db).get_conversation_detail(current_user, conversation_id)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation and all of its messages."""
    ConversationService(db).delete_conversation(current_user, conversation_id)
