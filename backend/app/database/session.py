"""
Database engine and session factory.
"""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings


def normalize_database_url(url: str) -> str:
    """
    Render (and Heroku) provision PostgreSQL connection strings using the
    legacy "postgres://" scheme. Modern SQLAlchemy (1.4+) only recognizes
    "postgresql://" and raises `NoSuchModuleError` on the old scheme. This
    only touches URLs that actually start with "postgres://" — SQLite and
    already-correct "postgresql://" URLs pass through unchanged, so local
    development is unaffected.
    """
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


DATABASE_URL = normalize_database_url(settings.DATABASE_URL)

# SQLite needs this connect_arg when used with multiple threads (as FastAPI does).
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
