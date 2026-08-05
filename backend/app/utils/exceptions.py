"""
Custom application exceptions.

These are translated into proper HTTP responses by handlers registered
in app.main, keeping business logic decoupled from HTTP concerns.
"""


class AppException(Exception):
    """Base class for all custom application exceptions."""

    status_code: int = 400

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class NotFoundException(AppException):
    status_code = 404


class ConflictException(AppException):
    status_code = 409


class UnauthorizedException(AppException):
    status_code = 401


class ForbiddenException(AppException):
    status_code = 403


class BadRequestException(AppException):
    status_code = 400


class AIServiceException(AppException):
    status_code = 502
