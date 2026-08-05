"""
Theme service — simple CRUD for mentoring themes/topics (e.g. "Leadership",
"Public Speaking", "Career Transition").
"""
from sqlalchemy.orm import Session

from app.models.theme import Theme
from app.schemas.theme import ThemeCreate
from app.utils.exceptions import NotFoundException, ConflictException


class ThemeService:
    def __init__(self, db: Session):
        self.db = db

    def list_themes(self) -> list[Theme]:
        return self.db.query(Theme).order_by(Theme.name).all()

    def get_theme(self, theme_id: str) -> Theme:
        theme = self.db.get(Theme, theme_id)
        if not theme:
            raise NotFoundException("Theme not found")
        return theme

    def create_theme(self, payload: ThemeCreate) -> Theme:
        existing = self.db.query(Theme).filter(Theme.name == payload.name).first()
        if existing:
            raise ConflictException("Theme already exists")
        theme = Theme(name=payload.name)
        self.db.add(theme)
        self.db.commit()
        self.db.refresh(theme)
        return theme

    def delete_theme(self, theme_id: str) -> None:
        theme = self.get_theme(theme_id)
        self.db.delete(theme)
        self.db.commit()
