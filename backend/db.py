from typing import Optional

import asyncpg  # type: ignore[import-untyped]

from utils import require_env

DATABASE_URL: str = require_env("DATABASE_URL")

_pool: asyncpg.Pool | None = None


async def get_db_pool() -> asyncpg.Pool:
    """
    Return the shared asyncpg connection pool, creating it on first call.
    """
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL)
    return _pool
