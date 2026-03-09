from __future__ import annotations

import json
from typing import Any, Dict, List


def get_tools_catalog() -> List[Dict[str, Any]]:
    """Return the catalog of available tools in a provider-agnostic format.

    Each tool entry contains:
      - name: Stable tool name the model should return in function_call.function_name
      - description: Short human-readable description
      - arguments: JSON Schema-like dict describing properties, types, and required keys
    """
    return [
        {
            "name": "AddMediaById",
            "description": "Add an asset (by its media bin id) to a track at a start time, optionally with a duration or end time.",
            "arguments": {
                "type": "object",
                "properties": {
                    "scrubber_id": {"type": "string"},
                    "track_number": {"type": "integer", "minimum": 1},
                    "start_seconds": {"type": "number", "minimum": 0},
                    "duration_seconds": {"type": "number", "minimum": 0},
                    "end_seconds": {"type": "number", "minimum": 0},
                    "pixels_per_second": {"type": "integer", "minimum": 1, "default": 100},
                },
                "required": ["scrubber_id", "track_number", "start_seconds"],
                "additionalProperties": True,
            },
        },
        {
            "name": "CreateTrack",
            "description": "Create a new empty track at the end of the timeline.",
            "arguments": {
                "type": "object",
                "properties": {},
            },
        },
        {
            "name": "CreateTracks",
            "description": "Create N new empty tracks at the end of the timeline.",
            "arguments": {
                "type": "object",
                "properties": {
                    "count": {"type": "integer", "minimum": 1},
                },
                "required": ["count"],
            },
        },
        {
            "name": "PlaceAllAssetsParallel",
            "description": "Place all media bin assets each on a separate track in parallel starting at start_seconds.",
            "arguments": {
                "type": "object",
                "properties": {
                    "start_seconds": {"type": "number", "default": 0},
                    "duration_seconds": {"type": "number"},
                    "pixels_per_second": {"type": "integer", "minimum": 1, "default": 100},
                },
            },
        },
        {
            "name": "AddMediaByName",
            "description": "Add an asset by case-insensitive substring of its name to a track at a start time; optionally specify duration or end time.",
            "arguments": {
                "type": "object",
                "properties": {
                    "scrubber_name": {"type": "string"},
                    "track_number": {"type": "integer", "minimum": 1},
                    "start_seconds": {"type": "number", "minimum": 0},
                    "duration_seconds": {"type": "number", "minimum": 0},
                    "end_seconds": {"type": "number", "minimum": 0},
                    "pixels_per_second": {"type": "integer", "minimum": 1, "default": 100},
                },
                "required": ["scrubber_name", "track_number", "start_seconds"],
                "additionalProperties": True,
            },
        },
        {
            "name": "MoveScrubber",
            "description": "Move an existing scrubber to a new time and optionally a new track.",
            "arguments": {
                "type": "object",
                "properties": {
                    "scrubber_id": {"type": "string"},
                    "new_position_seconds": {"type": "number", "minimum": 0},
                    "new_track_number": {"type": "integer", "minimum": 1},
                    "pixels_per_second": {"type": "integer", "minimum": 1, "default": 100},
                },
                "required": ["scrubber_id", "new_position_seconds", "new_track_number"],
            },
        },
        {
            "name": "ResizeScrubber",
            "description": "Change the duration of an existing scrubber.",
            "arguments": {
                "type": "object",
                "properties": {
                    "scrubber_id": {"type": "string"},
                    "new_duration_seconds": {"type": "number", "minimum": 0},
                    "pixels_per_second": {"type": "integer", "minimum": 1, "default": 100},
                },
                "required": ["scrubber_id", "new_duration_seconds"],
            },
        },
        {
            "name": "MoveScrubbersByOffset",
            "description": "Move multiple scrubbers by a time offset (can be negative).",
            "arguments": {
                "type": "object",
                "properties": {
                    "scrubber_ids": {"type": "array", "items": {"type": "string"}},
                    "offset_seconds": {"type": "number"},
                    "pixels_per_second": {"type": "integer", "minimum": 1, "default": 100},
                },
                "required": ["scrubber_ids", "offset_seconds"],
            },
        },
        {
            "name": "DeleteScrubbersInTrack",
            "description": "Delete all scrubbers in a given track (1-based).",
            "arguments": {
                "type": "object",
                "properties": {
                    "track_number": {"type": "integer", "minimum": 1},
                },
                "required": ["track_number"],
            },
        },
        {
            "name": "UpdateTextContent",
            "description": "Update the text content of a text scrubber.",
            "arguments": {
                "type": "object",
                "properties": {
                    "scrubber_id": {"type": "string"},
                    "new_text_content": {"type": "string"},
                },
                "required": ["scrubber_id", "new_text_content"],
            },
        },
        {
            "name": "UpdateTextStyle",
            "description": "Update style properties of a text scrubber.",
            "arguments": {
                "type": "object",
                "properties": {
                    "scrubber_id": {"type": "string"},
                    "fontSize": {"type": "integer", "minimum": 1},
                    "fontFamily": {"type": "string"},
                    "color": {"type": "string"},
                    "textAlign": {"type": "string", "enum": ["left", "center", "right"]},
                    "fontWeight": {"type": "string", "enum": ["normal", "bold"]},
                },
                "required": ["scrubber_id"],
                "additionalProperties": True,
            },
        },
        {
            "name": "SetResolution",
            "description": "Set the project resolution (width x height).",
            "arguments": {
                "type": "object",
                "properties": {
                    "width": {"type": "integer", "minimum": 1},
                    "height": {"type": "integer", "minimum": 1},
                },
                "required": ["width", "height"],
            },
        },
        {
            "name": "SetAutoSize",
            "description": "Toggle autosize for the composition (overrides explicit resolution when true).",
            "arguments": {
                "type": "object",
                "properties": {
                    "auto": {"type": "boolean"},
                },
                "required": ["auto"],
            },
        },
    ]


def get_tools_catalog_json() -> str:
    """Return a compact JSON string of the catalog for embedding into prompts."""
    return json.dumps(get_tools_catalog(), separators=(",", ":"))


