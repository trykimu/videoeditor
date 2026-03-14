from fastapi import APIRouter, Depends

from auth.routes import get_current_user
from auth.schema import KimuJWT
from db import get_db_pool

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/projects")
async def list_projects(user: KimuJWT = Depends(get_current_user)) -> dict:
    """
    Return all projects for the authenticated user.
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, created_at
            FROM projects
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user.user_id,
        )

    projects = [
        {
            "id": str(row["id"]),
            "name": str(row["name"]),
            "created_at": row["created_at"].isoformat(),
        }
        for row in rows
    ]

    return {"projects": projects}
