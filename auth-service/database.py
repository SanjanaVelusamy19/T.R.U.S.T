"""
Database session and engine configuration.

SQLite is used for simplicity; SQLAlchemy models allow a future move to PostgreSQL
by changing the DATABASE_URL environment variable and running migrations.
"""

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


def _default_sqlite_url() -> str:
    """Ensure data directory exists for SQLite file storage."""
    data_dir = os.environ.get("AUTH_DATA_DIR", "./data")
    os.makedirs(data_dir, exist_ok=True)
    path = os.path.join(data_dir, "trust_auth.db")
    return f"sqlite:///{path}"


DATABASE_URL = os.environ.get("DATABASE_URL", _default_sqlite_url())

# SQLite needs check_same_thread=False when used with FastAPI async stack
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for ORM models."""

    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create database tables if they do not exist."""
    from models import User  # noqa: F401 — register model metadata

    Base.metadata.create_all(bind=engine)
