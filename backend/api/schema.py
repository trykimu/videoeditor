from pydantic import BaseModel, ConfigDict, Field


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255, description="The name of the project")


class RenameProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255, description="The new name for the project")


class TimelineTrackPayload(BaseModel):
    # extra="allow" is intentional: the full timeline (including transitions and
    # scrubber fields) is passed through and stored verbatim as JSONB.
    model_config = ConfigDict(extra="allow")

    scrubbers: list[dict] = Field(default_factory=list, description="Track scrubbers list")


class TimelinePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    tracks: list[TimelineTrackPayload] = Field(..., description="Timeline tracks payload")
