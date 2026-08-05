"""
Pydantic schemas for Profile.
"""
from pydantic import BaseModel, ConfigDict

from app.models.profile import MentoringRole, EngagementType
from app.schemas.theme import ThemeOut


class ProfileBase(BaseModel):
    current_position: str | None = None
    entity: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    mentoring_role: MentoringRole = MentoringRole.MENTEE
    engagement_type: EngagementType = EngagementType.REMOTE
    previous_mentoring_experience: bool = False
    motivations: str | None = None
    contributions: str | None = None
    active_engagement: bool = True


class ProfileCreate(ProfileBase):
    theme_ids: list[str] | None = None


class ProfileUpdate(BaseModel):
    current_position: str | None = None
    entity: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    mentoring_role: MentoringRole | None = None
    engagement_type: EngagementType | None = None
    previous_mentoring_experience: bool | None = None
    motivations: str | None = None
    contributions: str | None = None
    active_engagement: bool | None = None


class ProfileOut(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    themes: list[ThemeOut] = []
