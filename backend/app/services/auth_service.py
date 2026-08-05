"""
Authentication service — registration and login business logic.
"""
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, AuthResponse
from app.schemas.user import UserCreate, UserOut
from app.utils.exceptions import ConflictException, UnauthorizedException


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, payload: UserCreate) -> AuthResponse:
        existing = self.db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise ConflictException("A user with this email already exists")

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        token = self._issue_token(user)
        return AuthResponse(user=UserOut.model_validate(user), token=token)

    def login(self, payload: LoginRequest) -> AuthResponse:
        user = self.db.query(User).filter(User.email == payload.email).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedException("User account is inactive")

        token = self._issue_token(user)
        return AuthResponse(user=UserOut.model_validate(user), token=token)

    @staticmethod
    def _issue_token(user: User) -> Token:
        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"role": user.role.value, "email": user.email},
        )
        return Token(access_token=access_token)
