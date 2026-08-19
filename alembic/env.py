"""Alembic migration environment.

This file is what Alembic runs on every `alembic` command. Its two jobs:

  1. Give Alembic a database URL (here: from the app's own settings, so
     `.env` stays the single source of truth).
  2. Give Alembic the SQLAlchemy metadata (here: the app's `Base.metadata`
     after every model module has been imported, exactly like app/main.py
     does for `Base.metadata.create_all`).

Only the logging config below comes from alembic.ini; the URL comes from
`app.core.config.settings.DATABASE_URL`.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine

# App settings -> DATABASE_URL from .env (no duplicated credentials).
from app.core.config import settings

# Importing the model modules is REQUIRED even though we don't use them
# directly: it registers every table with Base.metadata so `autogenerate`
# can see the whole schema. Same pattern as app/main.py.
import app.models.associations  # noqa: F401
import app.models.cart  # noqa: F401
import app.models.orders  # noqa: F401
import app.models.product  # noqa: F401
import app.models.profile  # noqa: F401
import app.models.user  # noqa: F401
import app.models.demo
from app.db.base import Base

# Alembic Config object (reads alembic.ini).
config = context.config

# Configure the Python logging from the [loggers]/[handlers] sections of
# alembic.ini. No-op if alembic.ini has no logging config.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Every table the models define. Autogenerate diffs this against the live
# database and emits the upgrade/downgrade operations.
target_metadata = Base.metadata

# Same sqlite handling as app/db/database.py.
def _connect_args():
    if settings.DATABASE_URL.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def run_migrations_offline() -> None:
    """Generate SQL without a live DB connection (--sql flag).

    Used for producing a .sql file to eyeball or hand-apply.
    """
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=config.get_main_option("compare_type", "false").lower() == "true",
        render_as_batch=settings.DATABASE_URL.startswith("sqlite"),
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against the real database."""

    # SQLite only supports a limited subset of ALTER TABLE, so Alembic
    # needs "batch mode" to add/drop columns there (test.db / local runs).
    connectable = create_engine(
        settings.DATABASE_URL,
        connect_args=_connect_args(),
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=config.get_main_option("compare_type", "false").lower() == "true",
            render_as_batch=settings.DATABASE_URL.startswith("sqlite"),
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
