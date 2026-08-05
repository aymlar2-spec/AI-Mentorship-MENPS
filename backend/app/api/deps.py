"""
Shared FastAPI dependencies: DB session access, current user resolution,
and role-based access guards.
"""
from typing import Callable

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User, UserRole
from app.utils.exceptions import UnauthorizedException, ForbiddenException

# Login is a plain JSON endpoint (see app.routers.auth), so we authenticate
# requests via a simple "Authorization: Bearer <token>" header rather than
# the OAuth2 password-form flow. This also renders as a clean "Authorize"
# button (paste raw JWT) in Swagger UI.
bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the currently authenticated user from the JWT bearer token."""
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException("Invalid authentication credentials")
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")

    user = db.get(User, user_id)
    if user is None:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise ForbiddenException("User account is inactive")
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Alias dependency kept for readability at call sites."""
    return current_user


def require_roles(*allowed_roles: UserRole) -> Callable[[User], User]:
    """
    Dependency factory that restricts an endpoint to specific user roles.

    Usage: Depends(require_roles(UserRole.ADMIN))
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Role '{current_user.role.value}' is not permitted to access this resource"
            )
        return current_user

    return dependency
