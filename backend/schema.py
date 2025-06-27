from typing import Literal

from pydantic import BaseModel, Field


class TextProperties(BaseModel):
    textContent: str = Field(description="The text content to display")
    fontSize: int = Field(description="Font size in pixels")
    fontFamily: str = Field(description="Font family name")
    color: str = Field(description="Text color in hex format")
    textAlign: Literal["left", "center", "right"] = Field(description="Text alignment")
    fontWeight: Literal["normal", "bold"] = Field(description="Font weight")


class BaseScrubber(BaseModel):
    id: str = Field(description="Unique identifier for the scrubber")
    mediaType: Literal["video", "image", "text"] = Field(description="Type of media")
    mediaUrlLocal: str | None = Field(description="Local URL for the media file", default=None)
    mediaUrlRemote: str | None = Field(description="Remote URL for the media file", default=None)
    media_width: int = Field(description="Width of the media in pixels")
    media_height: int = Field(description="Height of the media in pixels")
    text: TextProperties | None = Field(description="Text properties if mediaType is text", default=None)


class MediaBinItem(BaseScrubber):
    name: str = Field(description="Display name for the media item")
    durationInSeconds: float = Field(description="Duration of the media in seconds")


class ScrubberState(MediaBinItem):
    left: int = Field(description="Left position in pixels on the timeline")
    y: int = Field(description="Track position (0-based index)")
    width: int = Field(description="Width of the scrubber in pixels")
    
    # Player properties
    left_player: int = Field(description="Left position in the player view")
    top_player: int = Field(description="Top position in the player view")
    width_player: int = Field(description="Width in the player view")
    height_player: int = Field(description="Height in the player view")
    is_dragging: bool = Field(description="Whether the scrubber is currently being dragged")


class TrackState(BaseModel):
    id: str = Field(description="Unique identifier for the track")
    scrubbers: list[ScrubberState] = Field(description="List of scrubbers on this track")


class TimelineState(BaseModel):
    tracks: list[TrackState] = Field(description="List of tracks in the timeline")


class LLMAddScrubberToTimelineArgs(BaseModel):
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


class LLMMoveScrubberArgs(BaseModel):
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
