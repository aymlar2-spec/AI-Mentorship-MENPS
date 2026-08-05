"""
Theme model and its many-to-many association with Profile.
"""
import uuid

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Theme(Base):
    __tablename__ = "themes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    profile_themes: Mapped[list["ProfileTheme"]] = relationship(
        "ProfileTheme", back_populates="theme", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Theme id={self.id} name={self.name}>"


class ProfileTheme(Base):
    """Association table linking Profiles to Themes (many-to-many)."""

    __tablename__ = "profile_themes"
    __table_args__ = (UniqueConstraint("profile_id", "theme_id", name="uq_profile_theme"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    theme_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("themes.id", ondelete="CASCADE"), nullable=False
    )

    profile: Mapped["Profile"] = relationship("Profile", back_populates="profile_themes")
    theme: Mapped["Theme"] = relationship("Theme", back_populates="profile_themes")
