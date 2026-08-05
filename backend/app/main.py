"""
MENPS — AI Mentorship Platform for Women.

FastAPI application entrypoint: wires up middleware, exception handlers,
routers and (for local/dev convenience) automatic table creation.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine
from app.utils.exceptions import AppException

# Ensure all models are imported (and thus registered on Base.metadata)
# before any create_all() or Alembic autogenerate call.
from app import models  # noqa: F401

from app.routers import auth, users, profiles, themes, matching, ai, conversations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API backend for the AI Mentorship Platform for Women (MENPS). "
        "Provides authentication, profile management, a deterministic "
        "mentor-mentee matching engine, AI-powered coaching (Gemini), and "
        "conversation history."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Translate domain exceptions into clean JSON HTTP error responses."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.on_event("startup")
def on_startup() -> None:
    """
    Create database tables on startup for local/dev convenience.

    In production, prefer running Alembic migrations explicitly
    (`alembic upgrade head`) instead of relying on this.
    """
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured (create_all).")


@app.get("/", tags=["Health"])
def root():
    """Basic service info."""
    return {"service": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}


# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(themes.router)
app.include_router(matching.router)
app.include_router(ai.router)
app.include_router(conversations.router)
