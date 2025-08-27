import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, ConfigDict

from schema import FunctionCallResponse, MediaBinItem, TimelineState

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()
gemini_api = genai.Client(api_key=GEMINI_API_KEY)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    # Be permissive with incoming payloads from the frontend
    model_config = ConfigDict(extra="ignore")

    message: str  # the full user message
    mentioned_scrubber_ids: list[str] | None = None  # scrubber ids mentioned via '@'
    # Accept any shape for resilience; backend does not mutate these
    timeline_state: dict[str, Any] | None = None  # current timeline state
    mediabin_items: list[dict[str, Any]] | None = None  # current media bin
    chat_history: list[dict[str, Any]] | None = None  # prior turns: [{"role":"user"|"assistant","content":"..."}]


@app.post("/ai")
async def process_ai_message(request: Message) -> FunctionCallResponse:
    print(FunctionCallResponse)
    try:
        response = gemini_api.models.generate_content(
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
        print(response)

        return response.parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=3000)
