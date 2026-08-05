"""
Thin wrapper around Google's Generative AI SDK (Gemini).

Isolating the SDK here keeps the rest of the codebase independent from the
specific AI provider — swapping providers later only requires changing this
module.
"""
import logging

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from app.core.config import settings
from app.utils.exceptions import AIServiceException

logger = logging.getLogger(__name__)

# Hard timeout (seconds) for the Gemini API call so a network issue or an
# unreachable endpoint never hangs a request indefinitely.
REQUEST_TIMEOUT_SECONDS = 30

_configured = False


def _ensure_configured() -> None:
    global _configured
    if not _configured:
        if not settings.GEMINI_API_KEY:
            raise AIServiceException(
                "GEMINI_API_KEY is not configured. Set it in your .env file."
            )
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _configured = True


class GeminiClient:
    """Synchronous Gemini text-generation client."""

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.GEMINI_MODEL

    def generate(self, system_instruction: str, prompt: str) -> str:
        """
        Generate a text completion from Gemini given a system instruction
        (context/persona) and a user prompt.
        """
        try:
            _ensure_configured()
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction,
            )
            response = model.generate_content(
                prompt,
                request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
            )
            text = getattr(response, "text", None)
            if not text:
                raise AIServiceException("Gemini returned an empty response")
            return text
        except AIServiceException:
            raise
        except google_exceptions.DeadlineExceeded as exc:
            logger.warning("Gemini API call timed out after %ss", REQUEST_TIMEOUT_SECONDS)
            raise AIServiceException("The AI service took too long to respond. Please try again.") from exc
        except Exception as exc:  # noqa: BLE001 - convert any SDK error to a domain exception
            logger.exception("Gemini API call failed")
            raise AIServiceException(f"AI service error: {exc}") from exc
