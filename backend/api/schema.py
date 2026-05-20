from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CreateProjectRequest(BaseModel):
    name: str = Field(
        min_length=1, max_length=255, description="The name of the project"
    )


class RenameProjectRequest(BaseModel):
    name: str = Field(
        min_length=1, max_length=255, description="The new name for the project"
    )


class TimelineTrackPayload(BaseModel):
    # extra="allow" is intentional: the full timeline (including transitions and
    # scrubber fields) is passed through and stored verbatim as JSONB.
    model_config = ConfigDict(extra="allow")

    scrubbers: list[dict] = Field(
        default_factory=list, description="Track scrubbers list"
    )


class TimelinePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    tracks: list[TimelineTrackPayload] = Field(
        ..., description="Timeline tracks payload"
    )


# ─── Response models ─────────────────────────────────────────────────────────


class ProjectMeta(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    projects: list[ProjectMeta]
    total: int
    limit: int
    offset: int


class ProjectCreateResponse(BaseModel):
    project: ProjectMeta


class ProjectStateResponse(BaseModel):
    project: ProjectMeta
    timeline: dict[str, Any]
    textBinItems: list[dict[str, Any]]


class ProjectMutationResponse(BaseModel):
    ok: bool
    project_id: str


class StorageResponse(BaseModel):
    usedBytes: int
    limitBytes: int
