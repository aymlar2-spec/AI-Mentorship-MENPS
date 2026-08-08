"""
Profile management endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.matching import Matching
from app.models.user import User, UserRole
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut
from app.schemas.theme import AssignThemesRequest
from app.services.profile_service import ProfileService
from app.utils.exceptions import ForbiddenException

router = APIRouter(prefix="/api/v1/profiles", tags=["Profiles"])


def _has_been_matched(db: Session, mentee_id: str, mentor_id: str) -> bool:
    """True if a Matching record links this mentee and mentor (in either
    direction), i.e. the matching engine has actually recommended one to
    the other at some point."""
    return (
        db.query(Matching)
        .filter(
            Matching.mentee_id == mentee_id,
            Matching.mentor_id == mentor_id,
        )
        .first()
        is not None
    )


def _ensure_can_view_profile(current_user: User, user_id: str, db: Session) -> None:
    """
    Viewing rules for GET /profiles/{user_id}:
      - Admins can view anyone.
      - Users can always view their own profile.
      - A mentee can view a mentor's profile if the matching engine has
        actually recommended that mentor to them (a real Matching record
        exists) — this is what lets the "Contact this mentor" feature show
        phone/WhatsApp once a mentee has a genuine match, without opening
        profile access to mentors in general.
    Mentors cannot view mentee profiles this way (mentees don't get
    "recommended" to mentors), keeping this a narrow, match-scoped
    exception rather than a broad relaxation.
    """
    if current_user.role == UserRole.ADMIN or current_user.id == user_id:
        return
    if current_user.role == UserRole.MENTEE and _has_been_matched(db, current_user.id, user_id):
        return
    raise ForbiddenException("You are not authorized to view this profile")


@router.post("/me", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
def create_my_profile(
    payload: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create the profile for the currently authenticated user."""
    return ProfileService(db).create_profile(current_user.id, payload)


@router.get("/me", response_model=ProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the profile of the currently authenticated user."""
    return ProfileService(db).get_profile(current_user.id)


@router.patch("/me", response_model=ProfileOut)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the profile of the currently authenticated user."""
    return ProfileService(db).update_profile(current_user.id, payload)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete the profile of the currently authenticated user."""
    ProfileService(db).delete_profile(current_user.id)


@router.post("/me/themes", response_model=ProfileOut)
def assign_my_themes(
    payload: AssignThemesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign (replace) the set of themes tied to the current user's profile."""
    return ProfileService(db).assign_themes(current_user.id, payload.theme_ids)


@router.get("/{user_id}", response_model=ProfileOut)
def get_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get any user's profile. Admins can view anyone; users can view
    themselves; a mentee can also view a mentor's profile once the
    matching engine has actually recommended that mentor to them.
    """
    _ensure_can_view_profile(current_user, user_id, db)
    return ProfileService(db).get_profile(user_id)
