"""
Import all models here so that Alembic and Base.metadata.create_all()
can discover every mapped class through a single import point.
"""
from app.models.user import User, UserRole
from app.models.profile import Profile, MentoringRole, EngagementType
from app.models.theme import Theme, ProfileTheme
from app.models.matching import Matching
from app.models.conversation import Conversation, Message, MessageRole

__all__ = [
    "User",
    "UserRole",
    "Profile",
    "MentoringRole",
    "EngagementType",
    "Theme",
    "ProfileTheme",
    "Matching",
    "Conversation",
    "Message",
    "MessageRole",
]
