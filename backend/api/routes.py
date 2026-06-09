import json
import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from api.schema import (
    CreateProjectRequest,
    ProjectCreateResponse,
    ProjectListResponse,
    ProjectMeta,
    ProjectMutationResponse,
    ProjectStateResponse,
    RenameProjectRequest,
    StorageResponse,
    TimelinePayload,
)
from auth.routes import get_current_user
from auth.schema import SessionUser
from db import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api"])

# 2 GB per user (per-tier limits live in user_plans table once introduced).
_DEFAULT_STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024


def _row_to_meta(row: Any) -> ProjectMeta:
    return ProjectMeta(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        name=row["name"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    user: SessionUser = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> ProjectListResponse:
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

    return ProjectListResponse(
        projects=[_row_to_meta(row) for row in rows],
        total=int(total or 0),
        limit=limit,
        offset=offset,
    )


@router.post(
    "/projects",
    status_code=status.HTTP_201_CREATED,
    response_model=ProjectCreateResponse,
)
async def create_project(
    body: CreateProjectRequest,
    user: SessionUser = Depends(get_current_user),
) -> ProjectCreateResponse:
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
    return ProjectCreateResponse(project=_row_to_meta(row))


@router.put("/projects/{project_id}", response_model=ProjectMutationResponse)
async def save_project(
    timeline: TimelinePayload,
    project_id: UUID = Path(...),
    user: SessionUser = Depends(get_current_user),
) -> ProjectMutationResponse:
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
            str(project_id),
            user.user_id,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return ProjectMutationResponse(ok=True, project_id=str(row["id"]))


@router.get("/projects/{project_id}", response_model=ProjectStateResponse)
async def get_project(
    project_id: UUID = Path(...),
    user: SessionUser = Depends(get_current_user),
) -> ProjectStateResponse:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id, name, created_at, updated_at, timeline_state
            FROM projects
            WHERE id = $1 AND user_id = $2
            """,
            str(project_id),
            user.user_id,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    timeline_raw = row["timeline_state"]
    if isinstance(timeline_raw, str):
        try:
            timeline_raw = json.loads(timeline_raw)
        except json.JSONDecodeError:
            timeline_raw = None

    return ProjectStateResponse(
        project=_row_to_meta(row),
        timeline=timeline_raw if isinstance(timeline_raw, dict) else {"tracks": []},
        textBinItems=[],
    )


@router.patch("/projects/{project_id}", response_model=ProjectMutationResponse)
async def rename_project(
    body: RenameProjectRequest,
    project_id: UUID = Path(...),
    user: SessionUser = Depends(get_current_user),
) -> ProjectMutationResponse:
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
            str(project_id),
            user.user_id,
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return ProjectMutationResponse(ok=True, project_id=str(row["id"]))


@router.get("/storage", response_model=StorageResponse)
async def get_storage(user: SessionUser = Depends(get_current_user)) -> StorageResponse:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        used_bytes = await conn.fetchval(
            """
            SELECT COALESCE(SUM(file_size), 0)
              FROM assets
             WHERE user_id = $1
               AND deleted_at IS NULL
               AND status = 'ready'
            """,
            user.user_id,
        )
    return StorageResponse(
        usedBytes=int(used_bytes or 0),
        limitBytes=_DEFAULT_STORAGE_LIMIT_BYTES,
    )


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID = Path(...),
    user: SessionUser = Depends(get_current_user),
) -> None:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM projects WHERE id = $1 AND user_id = $2",
            str(project_id),
            user.user_id,
        )

    if result == "DELETE 0":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    logger.info("Project deleted: %s by user %s", project_id, user.user_id)
