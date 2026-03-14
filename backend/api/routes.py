from fastapi import APIRouter, Depends, HTTPException, status

from api.schema import CreateProjectRequest
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


@router.post("/create-project", status_code=status.HTTP_201_CREATED)
async def create_project(
    body: CreateProjectRequest,
    user: KimuJWT = Depends(get_current_user),
) -> dict:
    """
    Create a new project for the authenticated user.
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO projects (user_id, name)
            VALUES ($1, $2)
            RETURNING id, name, created_at
            """,
            user.user_id,
            body.name,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        )

    return {
        "project": {
            "id": str(row["id"]),
            "name": str(row["name"]),
            "created_at": row["created_at"].isoformat(),
        }
    }
