import json
import os
from functools import lru_cache
from typing import Literal

from google import genai
from openai import OpenAI

from ai.schema import FunctionCallResponse
from utils import require_env

_GEMINI_MODEL = "gemini-2.5-flash"
_ATLAS_BASE_URL = "https://api.atlascloud.ai/v1"
_ATLAS_MODEL = "deepseek-ai/deepseek-v4-pro"
_ATLAS_MAX_TOKENS = 4096

AIProvider = Literal["gemini", "atlascloud"]


def _first_env(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return None


def _provider_name() -> AIProvider:
    value = os.getenv("AI_PROVIDER", "gemini").strip().lower()
    if value == "gemini":
        return "gemini"
    if value in {"atlas", "atlas-cloud", "atlascloud"}:
        return "atlascloud"
    raise RuntimeError("AI_PROVIDER must be either 'gemini' or 'atlascloud'")


@lru_cache
def _gemini_client() -> genai.Client:
    return genai.Client(api_key=require_env("GEMINI_API_KEY"))


@lru_cache
def _atlas_client() -> OpenAI:
    api_key = _first_env("ATLASCLOUD_API_KEY", "ATLAS_CLOUD_API_KEY")
    if api_key is None:
        raise RuntimeError("ATLASCLOUD_API_KEY or ATLAS_CLOUD_API_KEY must be set")
    base_url = _first_env(
        "ATLASCLOUD_BASE_URL",
        "ATLAS_CLOUD_BASE_URL",
        "ATLASCLOUD_API_BASE",
        "ATLAS_CLOUD_API_BASE",
    )
    return OpenAI(api_key=api_key, base_url=base_url or _ATLAS_BASE_URL)


def _generate_with_gemini(prompt: str) -> FunctionCallResponse:
    response = _gemini_client().models.generate_content(
        model=_GEMINI_MODEL,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": FunctionCallResponse,
        },
    )
    return FunctionCallResponse.model_validate(response.parsed)


def _generate_with_atlas(prompt: str) -> FunctionCallResponse:
    model = _first_env("ATLASCLOUD_MODEL", "ATLAS_CLOUD_MODEL") or _ATLAS_MODEL
    schema = json.dumps(
        FunctionCallResponse.model_json_schema(),
        ensure_ascii=False,
        separators=(",", ":"),
    )
    completion = _atlas_client().chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "Return only a valid JSON object matching the schema supplied "
                    "in the user message."
                ),
            },
            {
                "role": "user",
                "content": f"{prompt}\n\n## Response JSON schema\n{schema}",
            },
        ],
        response_format={"type": "json_object"},
        max_tokens=_ATLAS_MAX_TOKENS,
    )
    content = completion.choices[0].message.content
    if content is None:
        raise ValueError("Atlas Cloud returned an empty response")
    return FunctionCallResponse.model_validate_json(content)


def generate_ai_response(prompt: str) -> FunctionCallResponse:
    if _provider_name() == "atlascloud":
        return _generate_with_atlas(prompt)
    return _generate_with_gemini(prompt)
