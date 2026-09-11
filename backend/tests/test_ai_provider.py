import os
import unittest
from unittest.mock import MagicMock, patch

from ai.provider import generate_ai_response


class AIProviderTest(unittest.TestCase):
    @patch("ai.provider._gemini_client")
    def test_gemini_remains_the_default_provider(
        self, gemini_client: MagicMock
    ) -> None:
        gemini_client.return_value.models.generate_content.return_value.parsed = {
            "function_call": None,
            "assistant_message": "Hello",
        }

        with patch.dict(os.environ, {"AI_PROVIDER": "gemini"}):
            response = generate_ai_response("hello")

        self.assertEqual(response.assistant_message, "Hello")
        gemini_client.return_value.models.generate_content.assert_called_once()

    @patch("ai.provider._atlas_client")
    def test_atlascloud_uses_openai_compatible_json_responses(
        self, atlas_client: MagicMock
    ) -> None:
        choice = MagicMock()
        choice.message.content = (
            '{"function_call":null,"assistant_message":"Hello from Atlas"}'
        )
        atlas_client.return_value.chat.completions.create.return_value.choices = [
            choice
        ]

        with patch.dict(
            os.environ,
            {
                "AI_PROVIDER": "atlascloud",
                "ATLASCLOUD_MODEL": "qwen/qwen3.5-flash",
            },
        ):
            response = generate_ai_response("hello")

        self.assertEqual(response.assistant_message, "Hello from Atlas")
        call = atlas_client.return_value.chat.completions.create.call_args.kwargs
        self.assertEqual(call["model"], "qwen/qwen3.5-flash")
        self.assertEqual(call["response_format"], {"type": "json_object"})
        self.assertEqual(call["max_tokens"], 4096)
        self.assertIn("Response JSON schema", call["messages"][1]["content"])

    def test_unknown_provider_is_rejected(self) -> None:
        with (
            patch.dict(os.environ, {"AI_PROVIDER": "unknown"}),
            self.assertRaisesRegex(RuntimeError, "AI_PROVIDER"),
        ):
            generate_ai_response("hello")


if __name__ == "__main__":
    unittest.main()
