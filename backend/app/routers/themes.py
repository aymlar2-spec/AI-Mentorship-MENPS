"""
Theme (topic/skill tag) management endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.theme import ThemeCreate, ThemeOut
from app.services.theme_service import ThemeService

router = APIRouter(prefix="/api/v1/themes", tags=["Themes"])


@router.get("", response_model=list[ThemeOut])
def list_themes(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """List all available mentoring themes."""
    return ThemeService(db).list_themes()


@router.post("", response_model=ThemeOut, status_code=status.HTTP_201_CREATED)
def create_theme(
    payload: ThemeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new mentoring theme. Admin only."""
    return ThemeService(db).create_theme(payload)


@router.delete("/{theme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_theme(
    theme_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a mentoring theme. Admin only."""
    ThemeService(db).delete_theme(theme_id)
