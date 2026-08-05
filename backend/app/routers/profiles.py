"""
Profile management endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut
from app.schemas.theme import AssignThemesRequest
from app.services.profile_service import ProfileService
from app.utils.exceptions import ForbiddenException

router = APIRouter(prefix="/api/v1/profiles", tags=["Profiles"])


def _ensure_self_or_admin(current_user: User, user_id: str) -> None:
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise ForbiddenException("You can only manage your own profile")


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
    """Get any user's profile. Admins can view anyone; users can view themselves."""
    _ensure_self_or_admin(current_user, user_id)
    return ProfileService(db).get_profile(user_id)
