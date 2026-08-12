"""
Alembic environment configuration.

Wires Alembic to the application's SQLAlchemy metadata and DATABASE_URL so
`alembic revision --autogenerate` and `alembic upgrade head` work out of the
box against whatever database is configured in `.env`.
"""
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make the `app` package importable when Alembic is run from the project root.
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.database.base import Base  # noqa: E402
from app.database.session import normalize_database_url  # noqa: E402
from app import models  # noqa: E402,F401  (ensures all models are registered)

config = context.config

# Override the sqlalchemy.url from alembic.ini with the app's configured DB
# URL, normalized the same way app/database/session.py does (Render's
# Postgres URLs use the legacy "postgres://" scheme, which Alembic's engine
# creation would otherwise reject).
config.set_main_option("sqlalchemy.url", normalize_database_url(settings.DATABASE_URL))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL without a DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (executes against a live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
