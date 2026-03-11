import os
from typing import Any

from fastapi import APIRouter, HTTPException
from google import genai
from pydantic import BaseModel, ConfigDict

from ai.schema import FunctionCallResponse

router = APIRouter(tags=["ai"])


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        raise ValueError(f"{name} is not set")
    return value


GEMINI_API_KEY: str = require_env("GEMINI_API_KEY")

gemini_client: genai.Client = genai.Client(api_key=GEMINI_API_KEY)


class Message(BaseModel):
    # Be permissive with incoming payloads from the frontend
    model_config = ConfigDict(extra="ignore")

    message: str  # the full user message
    mentioned_scrubber_ids: list[str] | None = None  # scrubber ids mentioned via '@'
    # Accept any shape for resilience; backend does not mutate these
    timeline_state: dict[str, Any] | None = None  # current timeline state
    mediabin_items: list[dict[str, Any]] | None = None  # current media bin
    chat_history: list[dict[str, Any]] | None = (
        None  # prior turns: [{"role":"user"|"assistant","content":"..."}]
    )


@router.post("/ai")
async def process_ai_message(request: Message) -> FunctionCallResponse:
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
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

            Conversation so far (oldest first): {request.chat_history}

            User message: {request.message}
            Mentioned scrubber ids: {request.mentioned_scrubber_ids}
            Timeline state: {request.timeline_state}
            Media bin items: {request.mediabin_items}
            """,
            config={
                "response_mime_type": "application/json",
                "response_schema": FunctionCallResponse,
            },
        )

        return FunctionCallResponse.model_validate(response.parsed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
