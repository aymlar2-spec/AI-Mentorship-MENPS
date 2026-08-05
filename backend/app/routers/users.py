"""
User management endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_my_user(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.get("", response_model=list[UserOut])
def list_users(
    role: UserRole | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """List all users, optionally filtered by role. Admin only."""
    return UserService(db).list_users(role=role, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single user by id. Admins can view anyone; users can view themselves."""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        from app.utils.exceptions import ForbiddenException

        raise ForbiddenException("You can only access your own user record")
    return UserService(db).get_by_id(user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user. Admins can update anyone; users can update themselves."""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        from app.utils.exceptions import ForbiddenException

        raise ForbiddenException("You can only update your own user record")
    return UserService(db).update_user(user_id, payload)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a user. Admin only."""
    UserService(db).delete_user(user_id)
