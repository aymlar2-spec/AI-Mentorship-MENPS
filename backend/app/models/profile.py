"""
Profile model — stores mentoring-related information about a user.
"""
import enum
import uuid

from sqlalchemy import String, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class MentoringRole(str, enum.Enum):
    MENTOR = "mentor"
    MENTEE = "mentee"
    BOTH = "both"


class EngagementType(str, enum.Enum):
    REMOTE = "remote"
    IN_PERSON = "in_person"
    HYBRID = "hybrid"


def _uuid() -> str:
    return str(uuid.uuid4())


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    current_position: Mapped[str | None] = mapped_column(String(255), nullable=True)
    entity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(50), nullable=True)

    mentoring_role: Mapped[MentoringRole] = mapped_column(
        Enum(MentoringRole), default=MentoringRole.MENTEE, nullable=False
    )
    engagement_type: Mapped[EngagementType] = mapped_column(
        Enum(EngagementType), default=EngagementType.REMOTE, nullable=False
    )

    previous_mentoring_experience: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    motivations: Mapped[str | None] = mapped_column(Text, nullable=True)
    contributions: Mapped[str | None] = mapped_column(Text, nullable=True)
    active_engagement: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
    profile_themes: Mapped[list["ProfileTheme"]] = relationship(
        "ProfileTheme", back_populates="profile", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Profile id={self.id} user_id={self.user_id}>"
