from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    # Ignore extra fields to stay compatible with richer frontend objects
    model_config = ConfigDict(extra="ignore")


class TextProperties(BaseSchema):
    textContent: str = Field(description="The text content to display")
    fontSize: int = Field(description="Font size in pixels")
    fontFamily: str = Field(description="Font family name")
    color: str = Field(description="Text color in hex format")
    textAlign: Literal["left", "center", "right"] = Field(description="Text alignment")
    fontWeight: Literal["normal", "bold"] = Field(description="Font weight")


class BaseScrubber(BaseSchema):
    id: str = Field(description="Unique identifier for the scrubber")
    mediaType: Literal["video", "image", "audio", "text"] = Field(description="Type of media")
    mediaUrlLocal: str | None = Field(default=None, description="Local URL for the media file")
    mediaUrlRemote: str | None = Field(default=None, description="Remote URL for the media file")
    media_width: int = Field(description="Width of the media in pixels")
    media_height: int = Field(description="Height of the media in pixels")
    text: TextProperties | None = Field(default=None, description="Text properties if mediaType is text")


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


class TrackState(BaseSchema):
    id: str = Field(description="Unique identifier for the track")
    scrubbers: list[ScrubberState] = Field(description="List of scrubbers on this track")


class TimelineState(BaseSchema):
    tracks: list[TrackState] = Field(description="List of tracks in the timeline")


class UniversalToolCall(BaseSchema):
    """V2 universal tool-call envelope.

    - function_name: name of the tool to execute
    - arguments: free-form args specific to the tool (extensible without code changes)
    """

    function_name: str = Field(description="The name of the function to call")
    arguments: dict[str, Any] | None = Field(default=None, description="Arguments for the function call")


class FunctionCallResponse(BaseSchema):
    """V2 AI response shape (universal schema).

    - function_call: UniversalToolCall when an action is requested
    - assistant_message: text response when no action is needed
    """

    function_call: UniversalToolCall | None = None
    assistant_message: str | None = None
