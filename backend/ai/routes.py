import json
import logging
import asyncio
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from pydantic import BaseModel, ConfigDict, Field

from ai.schema import FunctionCallResponse
from auth.routes import get_current_user
from auth.schema import SessionUser
from db import get_db_pool
from utils import require_env

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai"])

_GEMINI_MODEL = "gemini-2.5-flash"

GEMINI_API_KEY: str = require_env("GEMINI_API_KEY")
gemini_client: genai.Client = genai.Client(api_key=GEMINI_API_KEY)

_MAX_MESSAGE_LENGTH = 20_000
_MAX_HISTORY_ITEMS = 50
# Permissive caps — large enough for real projects (hundreds of scrubbers / media items) without
# hitting Gemini 2.5 Flash's ~1M-token context window. Tune when we have load data.
_MAX_TIMELINE_BYTES = 10 * 1024 * 1024  # 10 MB
_MAX_MEDIABIN_BYTES = 4 * 1024 * 1024  # 4 MB

# Per-user DB-backed rate limit. This is shared across worker processes and instances.
# For higher scale, replace with Redis.
_RATE_LIMIT_WINDOW_SECONDS = 60
_RATE_LIMIT_MAX_REQUESTS = 60
_RATE_LIMIT_TABLE = "ai_rate_limit_events"
_rate_limit_ready = False
_rate_limit_init_lock = asyncio.Lock()


async def _ensure_rate_limit_table() -> None:
    global _rate_limit_ready
    if _rate_limit_ready:
        return
    async with _rate_limit_init_lock:
        if _rate_limit_ready:
            return
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {_RATE_LIMIT_TABLE} (
                    user_id TEXT NOT NULL,
                    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
            await conn.execute(
                f"""
                CREATE INDEX IF NOT EXISTS idx_{_RATE_LIMIT_TABLE}_user_time
                ON {_RATE_LIMIT_TABLE} (user_id, occurred_at)
                """
            )
            await conn.execute(
                f"""
                CREATE INDEX IF NOT EXISTS idx_{_RATE_LIMIT_TABLE}_time
                ON {_RATE_LIMIT_TABLE} (occurred_at)
                """
            )
        _rate_limit_ready = True


async def _enforce_rate_limit(user_id: str) -> None:
    await _ensure_rate_limit_table()
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", user_id)
            await conn.execute(
                f"""
                DELETE FROM {_RATE_LIMIT_TABLE}
                WHERE occurred_at < now() - make_interval(secs => $1::int)
                """,
                _RATE_LIMIT_WINDOW_SECONDS,
            )
            count_row = await conn.fetchrow(
                f"SELECT COUNT(*)::int AS request_count FROM {_RATE_LIMIT_TABLE} WHERE user_id = $1",
                user_id,
            )
            request_count = int(count_row["request_count"]) if count_row else 0
            if request_count >= _RATE_LIMIT_MAX_REQUESTS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded: {_RATE_LIMIT_MAX_REQUESTS} requests per minute",
                )
            await conn.execute(
                f"INSERT INTO {_RATE_LIMIT_TABLE} (user_id) VALUES ($1)",
                user_id,
            )


class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")

    message: str = Field(max_length=_MAX_MESSAGE_LENGTH)
    mentioned_scrubber_ids: list[str] | None = None
    timeline_state: dict[str, Any] | None = None
    mediabin_items: list[dict[str, Any]] | None = None
    chat_history: list[dict[str, Any]] | None = None


@router.post("/ai")
async def process_ai_message(
    request: Message,
    user: SessionUser = Depends(get_current_user),
) -> FunctionCallResponse:
    await _enforce_rate_limit(user.user_id)

    # Bound the serialized payload before forwarding to Gemini to cap token spend.
    timeline_json = json.dumps(request.timeline_state or {}, ensure_ascii=False)
    if len(timeline_json) > _MAX_TIMELINE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Timeline state too large",
        )
    mediabin_json = json.dumps(request.mediabin_items or [], ensure_ascii=False)
    if len(mediabin_json) > _MAX_MEDIABIN_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Media bin too large",
        )

    # Truncate history to last N items to limit prompt size
    history = (request.chat_history or [])[-_MAX_HISTORY_ITEMS:]

    prompt = f"""
You are Kimu, an AI video-editing assistant.

## Response rules
- Call ONE tool when the user explicitly requests an editing action.
- Set function_call to null and return a short assistant_message for greetings, questions, or when the action is ambiguous.
- Never guess IDs — use scrubber_name or look them up in the timeline/media-bin data provided.
- Always use pixels_per_second=100 unless the user states otherwise.
- Tracks are 1-based: "track 1" → track_number=1, track_id="track-1".

## Tool catalogue

### Adding clips
- **LLMAddScrubberByName** — preferred when user says a clip name, track, and time.
  Args: scrubber_name (substring match), track_number (1-based), position_seconds, pixels_per_second=100
- **LLMAddScrubberToTimeline** — when you have the exact media-bin item id.
  Args: scrubber_id (exact), track_id ("track-N"), drop_left_px

### Moving & resizing
- **LLMMoveScrubber** — move a clip to a new time/track.
  Args: scrubber_id, new_position_seconds, new_track_number, pixels_per_second=100
- **LLMResizeScrubber** — change a clip's displayed duration.
  Args: scrubber_id (or scrubber_name+track_number), new_duration_seconds, pixels_per_second=100
- **LLMMoveScrubbersByOffset** — shift multiple clips forward/back by a delta.
  Args: scrubber_ids (list), offset_seconds (positive=right, negative=left), pixels_per_second=100

### Deleting
- **LLMDeleteScrubber** — remove one clip.
  Args: scrubber_id (or scrubber_name)
- **LLMDeleteScrubbersInTrack** — clear all clips from a track.
  Args: track_number

### Splitting
- **LLMSplitScrubber** — split a clip into two at a specific timeline time.
  Args: scrubber_id (or scrubber_name), time_seconds (absolute timeline position)

### Tracks
- **LLMCreateTrack** — add new empty track(s).
  Args: count=1

### Audio / video properties
- **LLMSetVolume** — set volume or mute for an audio/video clip.
  Args: scrubber_id (or scrubber_name), volume (0.0–1.0), muted=false
- **LLMSetPlaybackSpeed** — change playback speed. Allowed values: 0.25, 0.5, 1, 1.5, 2, 4.
  Args: scrubber_id (or scrubber_name), playback_rate

### Text clips
- **LLMUpdateTextContent** — change the text in a text clip.
  Args: scrubber_id, new_text_content
- **LLMUpdateTextStyle** — change font/size/colour/alignment.
  Args: scrubber_id, fontSize (px), fontFamily, color (hex), textAlign (left/center/right), fontWeight (normal/bold)

## Context
Conversation history (oldest first): {json.dumps(history, ensure_ascii=False)}
User message: {json.dumps(request.message, ensure_ascii=False)}
Mentioned clip IDs: {json.dumps(request.mentioned_scrubber_ids or [])}
Timeline state: {timeline_json}
Media bin: {mediabin_json}
"""

    try:
        response = gemini_client.models.generate_content(
            model=_GEMINI_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": FunctionCallResponse,
            },
        )
        return FunctionCallResponse.model_validate(response.parsed)
    except ValueError as exc:
        # Don't include user content (timeline / messages) in logs — log the type only.
        logger.warning("AI response validation failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=422, detail="Invalid response from AI model"
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error in AI endpoint for user %s", user.user_id)
        raise HTTPException(
            status_code=500, detail="AI service temporarily unavailable"
        ) from exc
