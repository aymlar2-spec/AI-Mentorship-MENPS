"""
Matching model — persists computed mentor/mentee compatibility results.
"""
import uuid
from datetime import datetime

from sqlalchemy import String, Float, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Matching(Base):
    __tablename__ = "matchings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    mentor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    mentee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    mentor: Mapped["User"] = relationship("User", foreign_keys=[mentor_id])
    mentee: Mapped["User"] = relationship("User", foreign_keys=[mentee_id])

    def __repr__(self) -> str:
        return f"<Matching mentor={self.mentor_id} mentee={self.mentee_id} score={self.score}>"
