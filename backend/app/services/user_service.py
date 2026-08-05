"""
User service — CRUD operations for the User resource.
"""
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.user import UserUpdate
from app.utils.exceptions import NotFoundException, ConflictException


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> User:
        user = self.db.get(User, user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    def list_users(
        self, role: UserRole | None = None, skip: int = 0, limit: int = 50
    ) -> list[User]:
        query = self.db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.offset(skip).limit(limit).all()

    def update_user(self, user_id: str, payload: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        data = payload.model_dump(exclude_unset=True)

        if "email" in data and data["email"] != user.email:
            existing = self.db.query(User).filter(User.email == data["email"]).first()
            if existing:
                raise ConflictException("A user with this email already exists")

        for field, value in data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: str) -> None:
        user = self.get_by_id(user_id)
        self.db.delete(user)
        self.db.commit()
