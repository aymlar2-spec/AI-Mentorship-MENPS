"""
Pydantic schemas for the matching engine.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserOut


class MatchCandidate(BaseModel):
    mentor: UserOut
    score: float
    explanation: str


class MatchResponse(BaseModel):
    mentee_id: str
    top_matches: list[MatchCandidate]


class MatchingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    mentor_id: str
    mentee_id: str
    score: float
    explanation: str | None = None
    created_at: datetime
