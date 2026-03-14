from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):
    name: str = Field(description="The name of the project")
