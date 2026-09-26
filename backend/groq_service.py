"""
CITYFLOW AI - Groq LLM Integration Service

Provides a centralized, reusable Groq client wrapper for reasoning and grounded
natural language generation. Strictly handles language synthesis; never acts as
the primary source of truth for traffic numbers or sensor data.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger("cityflow.groq_service")

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# Configurable model preference: default to openai/gpt-oss-120b with fallback to qwen/qwen3.8-27b
DEFAULT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODEL = "qwen/qwen3.8-27b"

_groq_client = None


def get_groq_client():
    """Return a singleton Groq client instance."""
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not found in environment variables.")
        return None

    try:
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
        return _groq_client
    except Exception as exc:
        logger.error("Failed to initialize Groq client: %s", exc)
        return None


def is_groq_available() -> bool:
    """Check if Groq API key is configured."""
    return bool(GROQ_API_KEY)


def generate_chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 800,
) -> Dict[str, Any]:
    """
    Generate a grounded chat response using Groq.
    
    Parameters:
    - messages: List of dicts with 'role' ('system', 'user', 'assistant') and 'content'.
    - model: Optional model override. Defaults to DEFAULT_MODEL.
    - temperature: Lower temperature (0.2) preferred for grounded factual consistency.
    - max_tokens: Maximum tokens in generated completion.
    
    Returns:
    - dict with 'success', 'content', 'model_used', and optional 'error'.
    """
    client = get_groq_client()
    if client is None:
        return {
            "success": False,
            "content": "",
            "error": "Groq client is unconfigured or unavailable.",
            "model_used": None,
        }

    target_models = [model or DEFAULT_MODEL, FALLBACK_MODEL]
    # Remove duplicates while preserving order
    seen = set()
    models_to_try = [m for m in target_models if not (m in seen or seen.add(m))]

    last_error = None
    for candidate_model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=candidate_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content or ""
            return {
                "success": True,
                "content": content.strip(),
                "model_used": candidate_model,
                "usage": {
                    "prompt_tokens": getattr(response.usage, "prompt_tokens", None),
                    "completion_tokens": getattr(response.usage, "completion_tokens", None),
                },
            }
        except Exception as exc:
            logger.warning("Groq completion failed with model %s: %s", candidate_model, exc)
            last_error = str(exc)

    return {
        "success": False,
        "content": "",
        "error": f"Groq completion failed across models: {last_error}",
        "model_used": None,
    }
