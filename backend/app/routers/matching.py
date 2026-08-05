"""
Matching endpoints — deterministic mentor/mentee compatibility computation.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.matching import MatchResponse, MatchingOut
from app.services.matching.service import MatchingService

router = APIRouter(prefix="/api/v1/matching", tags=["Matching"])


@router.post("/me", response_model=MatchResponse)
def match_me(
    top_n: int = Query(3, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MENTEE)),
):
    """
    Compute and persist the top N mentor matches for the currently
    authenticated mentee, using the deterministic matching algorithm.
    """
    return MatchingService(db).match_mentee(current_user.id, top_n=top_n)


@router.post("/{mentee_id}", response_model=MatchResponse)
def match_mentee(
    mentee_id: str,
    top_n: int = Query(3, ge=1, le=10),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Compute top N mentor matches for a specific mentee. Admin only."""
    return MatchingService(db).match_mentee(mentee_id, top_n=top_n)


@router.get("/history/me", response_model=list[MatchingOut])
def my_match_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve past computed matches involving the current user."""
    return MatchingService(db).history_for_user(current_user.id)
