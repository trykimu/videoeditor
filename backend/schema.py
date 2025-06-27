from typing import Literal

from pydantic import BaseModel, Field


class BaseFunctionArgs(BaseModel):
    pass


class LLMAddScrubberToTimelineArgs(BaseFunctionArgs):
    function_name: Literal["LLMAddScrubberToTimeline"] = Field(
        description="The name of the function to call"
    )
    scrubber_id: str = Field(
        description="The id of the scrubber to add to the timeline"
    )
    timeline_id: str = Field(
        description="The id of the timeline to add the scrubber to"
    )
    track_id: str = Field(description="The id of the track to add the scrubber to")
    drop_left_px: int = Field(description="The left position of the scrubber in pixels")


class LLMMoveScrubberArgs(BaseFunctionArgs):
    function_name: Literal["LLMMoveScrubber"] = Field(
        description="The name of the function to call"
    )
    scrubber_id: str = Field(description="The id of the scrubber to move")
    new_position_seconds: float = Field(
        description="The new position of the scrubber in seconds"
    )
    new_track_number: int = Field(description="The new track number of the scrubber")
    pixels_per_second: int = Field(description="The number of pixels per second")
    timeline_id: str = Field(
        description="The id of the timeline to move the scrubber in"
    )


class FunctionCallResponse(BaseModel):
    function_call: LLMAddScrubberToTimelineArgs | LLMMoveScrubberArgs
