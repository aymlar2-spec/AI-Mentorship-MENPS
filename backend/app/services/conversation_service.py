"""
Conversation service — manages conversation and message persistence for the
AI assistant chat history.
"""
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, Message, MessageRole
from app.models.user import User
from app.utils.exceptions import NotFoundException, ForbiddenException


class ConversationService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, user: User, conversation_id: str | None) -> Conversation:
        if conversation_id:
            conversation = self.db.get(Conversation, conversation_id)
            if not conversation:
                raise NotFoundException("Conversation not found")
            if conversation.user_id != user.id:
                raise ForbiddenException("This conversation does not belong to you")
            return conversation

        conversation = Conversation(user_id=user.id)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def add_message(self, conversation: Conversation, role: str, content: str) -> Message:
        message = Message(
            conversation_id=conversation.id,
            role=MessageRole(role),
            content=content,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_messages(self, conversation_id: str) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
            .all()
        )

    def list_conversations(self, user_id: str) -> list[Conversation]:
        return (
            self.db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.created_at.desc())
            .all()
        )

    def get_conversation_detail(self, user: User, conversation_id: str) -> Conversation:
        conversation = self.db.get(Conversation, conversation_id)
        if not conversation:
            raise NotFoundException("Conversation not found")
        if conversation.user_id != user.id:
            raise ForbiddenException("This conversation does not belong to you")
        return conversation

    def delete_conversation(self, user: User, conversation_id: str) -> None:
        conversation = self.get_conversation_detail(user, conversation_id)
        self.db.delete(conversation)
        self.db.commit()
