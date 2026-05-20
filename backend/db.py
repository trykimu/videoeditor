import logging
import os

import asyncpg  # type: ignore[import-untyped]

from utils import require_env

logger = logging.getLogger(__name__)

DATABASE_URL: str = require_env("DATABASE_URL")

_pool: asyncpg.Pool | None = None


async def get_db_pool() -> asyncpg.Pool:
    """Return the shared asyncpg connection pool, creating it on first call."""
    global _pool
    if _pool is None:
        ssl = "require" if os.getenv("DATABASE_SSL") == "true" else None
        try:
            _pool = await asyncpg.create_pool(
                DATABASE_URL,
                ssl=ssl,
                min_size=2,
                max_size=20,
                command_timeout=30,
            )
            logger.info("Database pool created")
        except Exception:
            logger.exception("Failed to create database pool")
            raise
    return _pool


async def close_db_pool() -> None:
    """Gracefully close the connection pool on shutdown."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed")
