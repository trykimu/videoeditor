import json

from fastapi import APIRouter, Depends, HTTPException, status

from api.schema import CreateProjectRequest, RenameProjectRequest
from auth.routes import get_current_user
from auth.schema import SessionUser
from db import get_db_pool

router = APIRouter(tags=["api"])


@router.get("/projects")
async def list_projects(user: SessionUser = Depends(get_current_user)) -> dict:
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


@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(
    body: CreateProjectRequest,
    user: SessionUser = Depends(get_current_user),
) -> dict:
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


@router.put("/projects/{project_id}")
async def save_project(
    project_id: str, timeline: dict, user: SessionUser = Depends(get_current_user)
) -> dict:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE projects
            SET timeline_state = $1::jsonb
            WHERE id = $2 AND user_id = $3
            RETURNING id
            """,
            json.dumps(timeline),
            project_id,
            user.user_id,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return {"ok": True, "project_id": str(row["id"])}


@router.patch("/projects/{project_id}")
async def rename_project(
    project_id: str, body: RenameProjectRequest, user: SessionUser = Depends(get_current_user)
) -> dict:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE projects
            SET name = $1
            WHERE id = $2 AND user_id = $3
            RETURNING id
            """,
            body.name,
            project_id,
            user.user_id,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return {"ok": True, "project_id": str(row["id"])}


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str, user: SessionUser = Depends(get_current_user)
) -> None:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            """
            DELETE FROM projects
            WHERE id = $1 AND user_id = $2
            """,
            project_id,
            user.user_id,
        )

    if result == "DELETE 0":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
