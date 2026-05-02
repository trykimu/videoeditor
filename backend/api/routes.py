import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.schema import CreateProjectRequest, RenameProjectRequest, TimelinePayload
from auth.routes import get_current_user
from auth.schema import SessionUser
from db import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])


@router.get("/projects")
async def list_projects(
    user: SessionUser = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, user_id, name, created_at, updated_at
            FROM projects
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            """,
            user.user_id,
            limit,
            offset,
        )
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM projects WHERE user_id = $1",
            user.user_id,
        )

    projects = [
        {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "name": row["name"],
            "created_at": row["created_at"].isoformat(),
            "updated_at": row["updated_at"].isoformat(),
        }
        for row in rows
    ]

    return {"projects": projects, "total": total, "limit": limit, "offset": offset}


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
            RETURNING id, user_id, name, created_at, updated_at
            """,
            user.user_id,
            body.name,
        )

    if row is None:
        logger.error("INSERT INTO projects returned no row for user %s", user.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        )

    logger.info("Project created: %s by user %s", str(row["id"]), user.user_id)
    return {
        "project": {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "name": row["name"],
            "created_at": row["created_at"].isoformat(),
            "updated_at": row["updated_at"].isoformat(),
        }
    }


@router.put("/projects/{project_id}")
async def save_project(
    project_id: str, timeline: TimelinePayload, user: SessionUser = Depends(get_current_user)
) -> dict:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE projects
            SET timeline_state = $1::jsonb,
                updated_at = now()
            WHERE id = $2 AND user_id = $3
            RETURNING id
            """,
            json.dumps(timeline.model_dump(mode="json")),
            project_id,
            user.user_id,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return {"ok": True, "project_id": str(row["id"])}


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str, user: SessionUser = Depends(get_current_user)
) -> dict:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id, name, created_at, updated_at, timeline_state
            FROM projects
            WHERE id = $1 AND user_id = $2
            """,
            project_id,
            user.user_id,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return {
        "project": {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "name": row["name"],
            "created_at": row["created_at"].isoformat(),
            "updated_at": row["updated_at"].isoformat(),
        },
        "timeline": row["timeline_state"] if row["timeline_state"] is not None else {"tracks": []},
        "textBinItems": [],
    }


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

    logger.info("Project deleted: %s by user %s", project_id, user.user_id)
