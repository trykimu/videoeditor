import os
from typing import Any

from dotenv import load_dotenv
import traceback
import json as _json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, ConfigDict
import re
from datetime import datetime, timedelta

from schema import FunctionCallResponse, MediaBinItem, TimelineState
from tools_registry import get_tools_catalog_json

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()
gemini_api = genai.Client(api_key=GEMINI_API_KEY)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


def _to_seconds(value: Any) -> float | None:
    """Best-effort conversion of a value to seconds (float).

    Supports numbers, "hh:mm[:ss]", and free-form like "1h 2m 3s", "90s", "2.5min".
    """
    if isinstance(value, (int, float)):
        try:
            v = float(value)
            if v == v:  # not NaN
                return v
        except Exception:
            return None
        return None
    if not isinstance(value, str):
        return None
    s = value.strip().lower()
    # hh:mm[:ss]
    if ":" in s:
        parts = [p for p in s.split(":") if p != ""]
        try:
            if len(parts) == 2:
                m, sec = float(parts[0]), float(parts[1])
                return m * 60 + sec
            if len(parts) == 3:
                h, m, sec = float(parts[0]), float(parts[1]), float(parts[2])
                return h * 3600 + m * 60 + sec
        except Exception:
            pass
    # 1h2m3s / 2m / 90s etc.
    total = 0.0
    matched = False
    for m in re.finditer(r"(?P<num>\d+(?:\.\d+)?)\s*(?P<unit>h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds|ms|millisecond|milliseconds)\b",
                         s):
        matched = True
        num = float(m.group("num"))
        unit = m.group("unit")
        if unit in {"h", "hr", "hrs", "hour", "hours"}:
            total += num * 3600
        elif unit in {"m", "min", "mins", "minute", "minutes"}:
            total += num * 60
        elif unit in {"ms", "millisecond", "milliseconds"}:
            total += num / 1000.0
        else:  # seconds
            total += num
    if matched:
        return total
    # plain number fallback
    try:
        v = float(s)
        return v if v == v else None
    except Exception:
        return None


def _normalize_time_fields_from_text(user_text: str, args: dict[str, Any]) -> dict[str, Any]:
    """Fill or fix start_seconds / duration_seconds / end_seconds from the user text.

    - Detect patterns like "from 2s to 12s", "at 2s", "for 10s", "span for 10s".
    - Also detect variants like "to 12 seconds long", "12s long", "set to 12s", "make it 12s".
    - If duration and start are present but end is not, compute end.
    - If end and start present but duration absent, compute duration.
    """
    updated = dict(args or {})
    text = (user_text or "").lower()

    # Extract explicit FROM ... TO ... first
    m = re.search(r"from\s+([^\s]+(?:\s*[a-z]+)?)\s+to\s+([^\s]+(?:\s*[a-z]+)?)", text)
    if m:
        start_candidate = _to_seconds(m.group(1))
        end_candidate = _to_seconds(m.group(2))
        if start_candidate is not None and updated.get("start_seconds") is None:
            updated["start_seconds"] = start_candidate
        if end_candidate is not None and updated.get("end_seconds") is None:
            updated["end_seconds"] = end_candidate

    # AT ... / START AT ... / FROM ... (single)
    m2 = re.search(r"(?:at|starting\s+at|start\s+at|from)\s+([^\s]+(?:\s*[a-z]+)?)", text)
    if m2 and updated.get("start_seconds") is None:
        start_candidate = _to_seconds(m2.group(1))
        if start_candidate is not None:
            updated["start_seconds"] = start_candidate

    # FOR ... / SPAN FOR ...
    m3 = re.search(r"(?:for|span(?:s)?\s+for)\s+([^\s]+(?:\s*[a-z]+)?)", text)
    if m3 and updated.get("duration_seconds") is None:
        dur_candidate = _to_seconds(m3.group(1))
        if dur_candidate is not None:
            updated["duration_seconds"] = dur_candidate

    # TO ... LONG / SET TO ... / MAKE (IT)? ...
    # Examples: "to 12 seconds long", "set to 12s", "make it 8 sec", "12s long"
    if updated.get("duration_seconds") is None:
        m4 = re.search(r"(?:to\s+)?([^\s]+(?:\s*[a-z]+)?)\s+long", text)
        if m4:
            dur_candidate = _to_seconds(m4.group(1))
            if dur_candidate is not None:
                updated["duration_seconds"] = dur_candidate
    if updated.get("duration_seconds") is None:
        m5 = re.search(r"(?:set\s+(?:it\s+)?to|make\s+(?:it\s+)?)\s+([^\s]+(?:\s*[a-z]+)?)", text)
        if m5:
            dur_candidate = _to_seconds(m5.group(1))
            if dur_candidate is not None:
                updated["duration_seconds"] = dur_candidate

    # Post-derivations
    start_val = _to_seconds(updated.get("start_seconds"))
    end_val = _to_seconds(updated.get("end_seconds"))
    dur_val = _to_seconds(updated.get("duration_seconds"))
    if start_val is not None and end_val is not None and dur_val is None:
        updated["duration_seconds"] = max(0.0, end_val - start_val)
    if start_val is not None and dur_val is not None and end_val is None:
        updated["end_seconds"] = max(0.0, start_val + dur_val)

    return updated


def _postprocess_response(user_text: str, resp: FunctionCallResponse) -> FunctionCallResponse:
    if resp and resp.function_call and isinstance(resp.function_call.arguments, dict):
        resp.function_call.arguments = _normalize_time_fields_from_text(user_text, resp.function_call.arguments)
    return resp


def _second_pass_force_tool(request: Message, assistant_note: str) -> FunctionCallResponse | None:
    """If the first pass returned only assistant text, try a second pass that
    explicitly asks for a single tool call when possible."""
    try:
        response_schema = {
            "type": "object",
            "properties": {
                "function_call": {
                    "type": "object",
                    "properties": {
                        "function_name": {"type": "string"},
                        "arguments": {"type": "object", "properties": {}},
                    },
                    "required": ["function_name"],
                },
                "assistant_message": {"type": "string"},
            },
        }
        response = gemini_api.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""You previously drafted a plan:\n\n{assistant_note}\n\nNow convert the user's latest instruction into exactly one tool call if applicable.\nReturn strictly a JSON object with either function_call or assistant_message.\nAvailable tools:\n{get_tools_catalog_json()}\n\nUser message: {request.message}\nTimeline state: {request.timeline_state}\nMedia bin items: {request.mediabin_items}\n""",
            config={
                "response_mime_type": "application/json",
                "response_schema": response_schema,
            },
        )
        text_payload = getattr(response, "text", None)
        if text_payload:
            data = _json.loads(text_payload)
            return FunctionCallResponse.model_validate(data)
    except Exception as e:
        print("[AI] Second-pass error:", repr(e))
    return None


@app.post("/ai")
async def process_ai_message(request: Message) -> FunctionCallResponse:
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set in environment")

        # Debug: incoming request summary
        try:
            print(
                "[AI] Incoming payload summary:",
                {
                    "message": request.message[:200] if request.message else None,
                    "mentioned_scrubber_ids": request.mentioned_scrubber_ids,
                    "timeline_state_present": request.timeline_state is not None,
                    "mediabin_count": len(request.mediabin_items or []),
                    "chat_history_count": len(request.chat_history or []),
                },
            )
        except Exception:
            pass

        # Minimal Gemini-compatible response schema (no additionalProperties, no unions)
        response_schema = {
            "type": "object",
            "properties": {
                "function_call": {
                    "type": "object",
                    "properties": {
                        "function_name": {"type": "string"},
                        "arguments": {
                            "type": "object",
                            "properties": {
                                # Generic placement/move
                                "scrubber_id": {"type": "string"},
                                "track_number": {"type": "integer"},
                                "track_id": {"type": "string"},
                                "start_seconds": {"type": "number"},
                                "position_seconds": {"type": "number"},
                                "drop_left_px": {"type": "integer"},
                                "duration_seconds": {"type": "number"},
                                "end_seconds": {"type": "number"},
                                "pixels_per_second": {"type": "integer"},
                                "scrubber_name": {"type": "string"},
                                "new_position_seconds": {"type": "number"},
                                "new_track_number": {"type": "integer"},
                                "scrubber_ids": {"type": "array", "items": {"type": "string"}},
                                "offset_seconds": {"type": "number"},
                                # Text styling/content
                                "new_text_content": {"type": "string"},
                                "fontSize": {"type": "integer"},
                                "fontFamily": {"type": "string"},
                                "color": {"type": "string"},
                                "textAlign": {"type": "string"},
                                "fontWeight": {"type": "string"},
                                # Composition settings
                                "width": {"type": "integer"},
                                "height": {"type": "integer"},
                                "auto": {"type": "boolean"},
                            },
                        },
                    },
                    "required": ["function_name"],
                },
                "assistant_message": {"type": "string"},
            },
        }

        response = gemini_api.models.generate_content(
             model="gemini-2.5-flash",
             contents=f"""You are Kimu, an AI assistant inside a video editor.

            You will return a JSON object with either:
            - function_call: {{"function_name": string, "arguments": object}}  [V2 universal schema]
            - assistant_message: string (when no action is needed or a clarification is required)

            Available tools (names and schemas):
            {get_tools_catalog_json()}

            Tool calling policy:
            - Call ONE tool only when the user's request is clear and safe to execute.
            - If ambiguous (e.g., no clear asset or time), return an assistant_message that asks a concise clarifying question.
            - Assume a single active timeline; do NOT require a timeline_id.
            - Tracks are named like "track-1", but users say "track 1" meaning 1-based index.
            - Default pixels_per_second = 100 if not provided.
            - If user mentions items with @, prefer those exact assets (via mentioned_scrubber_ids). Otherwise, map names by case-insensitive substring to media bin items.

            Editing semantics for time and duration:
            - "at 2 sec" or "at 2s" → start_seconds = 2.
            - "for 10 sec" → duration_seconds = 10.
            - "from 2 sec for 10 sec" → start_seconds = 2, duration_seconds = 10.
            - "from 2 sec to 12 sec" → start_seconds = 2, end_seconds = 12.
            - If duration is omitted, use the media's intrinsic duration if available; for images default to 5 seconds.

            

            Tool selection guidance:
            - If the user references @<asset>, call AddMediaById using mentioned_scrubber_ids[0].
            - If the user references an asset by name (e.g., "cardboard"), call AddMediaByName with scrubber_name="cardboard".
            - If user asks to make it span for N seconds, prefer AddMedia* with duration_seconds.
            - If user says "from A sec to B sec", pass start_seconds=A and end_seconds=B.
            - For deletions like "remove everything on track 2", call DeleteScrubbersInTrack with track_number=2.
 
             Conversation so far (oldest first): {request.chat_history}
 
             User message: {request.message}
             Mentioned scrubber ids: {request.mentioned_scrubber_ids}
             Timeline state: {request.timeline_state}
             Media bin items: {request.mediabin_items}
             """,
             config={
                 "response_mime_type": "application/json",
                 "response_schema": response_schema,
             },
         
        )
        # Debug: response object summary
        try:
            print("[AI] Raw response type:", type(response))
            # Some SDK versions expose .to_dict() or .candidates; print defensively
            cand = getattr(response, "candidates", None)
            if cand is not None:
                print("[AI] candidates len:", len(cand))
            text_preview = getattr(response, "text", None)
            if isinstance(text_preview, str):
                print("[AI] text preview:", text_preview[:200])
        except Exception:
            pass

        # Robust parsing across SDK versions
        parsed = getattr(response, "parsed", None)
        if parsed is not None:
            try:
                if isinstance(parsed, dict):
                    resp = FunctionCallResponse.model_validate(parsed)
                    return _postprocess_response(request.message, resp)
                # Some SDKs may return an object with attribute access
                maybe_name = getattr(parsed, "function_call", None)
                maybe_msg = getattr(parsed, "assistant_message", None)
                if maybe_name is not None or maybe_msg is not None:
                    as_dict = {}
                    if maybe_name is not None:
                        # function_call may itself be an object with attrs
                        fn = getattr(parsed.function_call, "function_name", None)
                        args = getattr(parsed.function_call, "arguments", None)
                        if args is None:
                            # also try dict-like
                            args = getattr(parsed.function_call, "get", lambda k, d=None: None)("arguments", None)
                        as_dict["function_call"] = {
                            "function_name": fn,
                            "arguments": args or {},
                        }
                    if maybe_msg is not None:
                        as_dict["assistant_message"] = maybe_msg
                    if as_dict:
                        resp = FunctionCallResponse.model_validate(as_dict)
                        # If no tool chosen, attempt a second pass
                        if resp.function_call is None and resp.assistant_message:
                            forced = _second_pass_force_tool(request, resp.assistant_message)
                            if forced is not None:
                                return _postprocess_response(request.message, forced)
                        return _postprocess_response(request.message, resp)
            except Exception:
                pass

        # Fallback: try JSON text
        text_payload = getattr(response, "text", None)
        if text_payload:
            try:
                data = _json.loads(text_payload)
                resp = FunctionCallResponse.model_validate(data)
                # If no tool chosen, try second pass using the assistant text
                if resp.function_call is None and resp.assistant_message:
                    forced = _second_pass_force_tool(request, resp.assistant_message)
                    if forced is not None:
                        return _postprocess_response(request.message, forced)
                return _postprocess_response(request.message, resp)
            except Exception as e:  # noqa: BLE001
                raise HTTPException(status_code=500, detail=f"Invalid JSON from model: {e}") from e

        # As a last resort, try to serialize the response to dict if available
        try:
            to_dict = getattr(response, "to_dict", None)
            if callable(to_dict):
                data = to_dict()
                resp = FunctionCallResponse.model_validate(data)
                return _postprocess_response(request.message, resp)
        except Exception:
            pass

        raise HTTPException(status_code=500, detail="Model returned no parseable content; enable debug logs for details")
    except Exception as e:
        # Print full traceback for debugging
        print("[AI] Error:", repr(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=3000)
