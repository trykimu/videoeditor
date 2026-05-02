import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from google import genai
from pydantic import BaseModel, ConfigDict, Field

from ai.schema import FunctionCallResponse
from utils import require_env

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai"])

_GEMINI_MODEL = "gemini-2.5-flash"

GEMINI_API_KEY: str = require_env("GEMINI_API_KEY")
gemini_client: genai.Client = genai.Client(api_key=GEMINI_API_KEY)

_MAX_MESSAGE_LENGTH = 5_000
_MAX_HISTORY_ITEMS = 20


class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")

    message: str = Field(max_length=_MAX_MESSAGE_LENGTH)
    mentioned_scrubber_ids: list[str] | None = None
    timeline_state: dict[str, Any] | None = None
    mediabin_items: list[dict[str, Any]] | None = None
    chat_history: list[dict[str, Any]] | None = None


@router.post("/ai")
async def process_ai_message(request: Message) -> FunctionCallResponse:
    # Truncate history to last N items to limit prompt size
    history = (request.chat_history or [])[-_MAX_HISTORY_ITEMS:]

    prompt = f"""
You are Kimu, an AI assistant inside a video editor. You can decide to either:
- call ONE tool from the provided schema when the user explicitly asks for an editing action, or
- return a short friendly assistant_message when no concrete action is needed (e.g., greetings, small talk, clarifying questions).

Strictly follow:
- If the user's message does not clearly request an editing action, set function_call to null and include an assistant_message.
- Only produce a function_call when it is safe and unambiguous to execute.

Inference rules:
- Assume a single active timeline; do NOT require a timeline_id.
- Tracks are named like "track-1", but when the user says "track 1" they mean number 1.
- Use pixels_per_second=100 by default if not provided.
- When the user names media like "twitter" or "twitter header", map that to the closest media in the media bin by name substring match.
- Prefer LLMAddScrubberByName when the user specifies a name, track number, and time in seconds.
- If the user asks to remove scrubbers in a specific track, call LLMDeleteScrubbersInTrack with that track number.

Conversation so far (oldest first): {json.dumps(history, ensure_ascii=False)}

User message: {json.dumps(request.message, ensure_ascii=False)}
Mentioned scrubber ids: {json.dumps(request.mentioned_scrubber_ids or [])}
Timeline state: {json.dumps(request.timeline_state or {}, ensure_ascii=False)}
Media bin items: {json.dumps(request.mediabin_items or [], ensure_ascii=False)}
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
        logger.warning("AI response validation error: %s", exc)
        raise HTTPException(status_code=422, detail="Invalid response from AI model") from exc
    except Exception as exc:
        logger.exception("Unexpected error in AI endpoint")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable") from exc
