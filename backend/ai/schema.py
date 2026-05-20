from typing import Literal

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
    mediaType: Literal["video", "image", "audio", "text"] = Field(
        description="Type of media"
    )
    mediaUrlLocal: str | None = Field(
        description="Local URL for the media file", default=None
    )
    mediaUrlRemote: str | None = Field(
        description="Remote URL for the media file", default=None
    )
    media_width: int = Field(description="Width of the media in pixels")
    media_height: int = Field(description="Height of the media in pixels")
    text: TextProperties | None = Field(
        description="Text properties if mediaType is text", default=None
    )


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
    is_dragging: bool = Field(
        description="Whether the scrubber is currently being dragged"
    )


class TrackState(BaseSchema):
    id: str = Field(description="Unique identifier for the track")
    scrubbers: list[ScrubberState] = Field(
        description="List of scrubbers on this track"
    )


class TimelineState(BaseSchema):
    tracks: list[TrackState] = Field(description="List of tracks in the timeline")


# ── Tool argument classes ────────────────────────────────────────────────────


class LLMAddScrubberToTimelineArgs(BaseSchema):
    function_name: Literal["LLMAddScrubberToTimeline"] = Field(
        description="Add a media-bin item to the timeline using its exact ID"
    )
    scrubber_id: str = Field(description="Exact media-bin item id to place")
    track_id: str = Field(description="Track id (e.g. 'track-1')")
    drop_left_px: int = Field(description="Left pixel offset on the timeline")


class LLMAddScrubberByNameArgs(BaseSchema):
    function_name: Literal["LLMAddScrubberByName"] = Field(
        description="Add a media-bin item to the timeline by matching its name"
    )
    scrubber_name: str = Field(description="Partial or full name of the media to add")
    track_number: int = Field(description="1-based track number")
    position_seconds: float = Field(description="Start time in seconds")
    pixels_per_second: int = Field(default=100, description="Pixels per second")


class LLMMoveScrubberArgs(BaseSchema):
    function_name: Literal["LLMMoveScrubber"] = Field(
        description="Move a clip to a new time position and/or track"
    )
    scrubber_id: str = Field(description="ID of the scrubber to move")
    new_position_seconds: float = Field(description="New start time in seconds")
    new_track_number: int = Field(description="1-based destination track number")
    pixels_per_second: int = Field(default=100, description="Pixels per second")


class LLMResizeScrubberArgs(BaseSchema):
    function_name: Literal["LLMResizeScrubber"] = Field(
        description="Change the displayed duration of a clip on the timeline"
    )
    scrubber_id: str | None = Field(default=None, description="ID of the clip to resize (prefer over name)")
    scrubber_name: str | None = Field(default=None, description="Name substring to find the clip if id unknown")
    track_number: int | None = Field(default=None, description="1-based track to search when id/name not given")
    new_duration_seconds: float = Field(description="New duration in seconds")
    pixels_per_second: int = Field(default=100, description="Pixels per second")


class LLMDeleteScrubberArgs(BaseSchema):
    function_name: Literal["LLMDeleteScrubber"] = Field(
        description="Remove a single clip from the timeline"
    )
    scrubber_id: str | None = Field(default=None, description="ID of the clip to delete")
    scrubber_name: str | None = Field(default=None, description="Name substring to find the clip if id unknown")


class LLMDeleteScrubbersInTrackArgs(BaseSchema):
    function_name: Literal["LLMDeleteScrubbersInTrack"] = Field(
        description="Remove ALL clips from a specific track"
    )
    track_number: int = Field(description="1-based track number to clear")


class LLMSetVolumeArgs(BaseSchema):
    function_name: Literal["LLMSetVolume"] = Field(
        description="Set the volume or mute state of an audio/video clip"
    )
    scrubber_id: str | None = Field(default=None, description="ID of the clip")
    scrubber_name: str | None = Field(default=None, description="Name substring to find the clip")
    volume: float = Field(ge=0.0, le=1.0, description="Volume level 0.0 (silent) to 1.0 (full)")
    muted: bool = Field(default=False, description="Whether to mute the clip")


class LLMSetPlaybackSpeedArgs(BaseSchema):
    function_name: Literal["LLMSetPlaybackSpeed"] = Field(
        description="Set the playback speed of a clip (0.25×, 0.5×, 1×, 1.5×, 2×, 4×)"
    )
    scrubber_id: str | None = Field(default=None, description="ID of the clip")
    scrubber_name: str | None = Field(default=None, description="Name substring to find the clip")
    playback_rate: float = Field(description="Speed multiplier: 0.25, 0.5, 1, 1.5, 2, or 4")


class LLMSplitScrubberArgs(BaseSchema):
    function_name: Literal["LLMSplitScrubber"] = Field(
        description="Split a clip into two at a given time position"
    )
    scrubber_id: str | None = Field(default=None, description="ID of the clip to split")
    scrubber_name: str | None = Field(default=None, description="Name substring to find the clip")
    time_seconds: float = Field(description="Absolute timeline time (in seconds) to split at")


class LLMCreateTrackArgs(BaseSchema):
    function_name: Literal["LLMCreateTrack"] = Field(
        description="Add one or more new empty tracks to the timeline"
    )
    count: int = Field(default=1, description="Number of tracks to create")


class LLMMoveScrubbersByOffsetArgs(BaseSchema):
    function_name: Literal["LLMMoveScrubbersByOffset"] = Field(
        description="Shift multiple clips forward or backward by a time offset"
    )
    scrubber_ids: list[str] = Field(description="IDs of the clips to shift")
    offset_seconds: float = Field(description="Seconds to shift (positive = right, negative = left)")
    pixels_per_second: int = Field(default=100, description="Pixels per second")


class LLMUpdateTextContentArgs(BaseSchema):
    function_name: Literal["LLMUpdateTextContent"] = Field(
        description="Change the text displayed in a text clip"
    )
    scrubber_id: str = Field(description="ID of the text clip")
    new_text_content: str = Field(description="New text to display")


class LLMUpdateTextStyleArgs(BaseSchema):
    function_name: Literal["LLMUpdateTextStyle"] = Field(
        description="Change font, size, colour, or alignment of a text clip"
    )
    scrubber_id: str = Field(description="ID of the text clip")
    fontSize: int | None = Field(default=None, description="Font size in pixels")
    fontFamily: str | None = Field(default=None, description="Font family name")
    color: str | None = Field(default=None, description="Colour as hex string, e.g. '#ff0000'")
    textAlign: Literal["left", "center", "right"] | None = Field(default=None, description="Text alignment")
    fontWeight: Literal["normal", "bold"] | None = Field(default=None, description="Font weight")


class FunctionCallResponse(BaseSchema):
    function_call: (
        LLMAddScrubberToTimelineArgs
        | LLMAddScrubberByNameArgs
        | LLMMoveScrubberArgs
        | LLMResizeScrubberArgs
        | LLMDeleteScrubberArgs
        | LLMDeleteScrubbersInTrackArgs
        | LLMSetVolumeArgs
        | LLMSetPlaybackSpeedArgs
        | LLMSplitScrubberArgs
        | LLMCreateTrackArgs
        | LLMMoveScrubbersByOffsetArgs
        | LLMUpdateTextContentArgs
        | LLMUpdateTextStyleArgs
        | None
    ) = None
    assistant_message: str | None = None
