"""LLM client abstraction — supports OpenAI and OpenRouter.

Priority:
  1. OPENAI_API_KEY → api.openai.com (default base URL)
  2. OPENROUTER_API_KEY → openrouter.ai/api/v1
  3. Neither set → stub response (pipeline keeps working without credits)

Model: LLM_MODEL env var, default 'gpt-4o-mini'.
"""
from __future__ import annotations

import logging
import os

logger = logging.getLogger("llm_client")

_DEFAULT_MODEL = "gpt-4o-mini"
_OPENROUTER_BASE = "https://openrouter.ai/api/v1"
_STUB_TEXT = "[LLM stub — no API key configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.]"


def _make_client():
    """Return an OpenAI-compatible client, or None if no keys are set."""
    from openai import OpenAI  # type: ignore[import-untyped]

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()

    if openai_key:
        return OpenAI(api_key=openai_key)
    if openrouter_key:
        return OpenAI(api_key=openrouter_key, base_url=_OPENROUTER_BASE)
    return None


def call_llm(prompt: str, *, system: str = "You are a helpful assistant.") -> str:
    """Call the configured LLM with a user prompt. Returns stub text when no key is set."""
    try:
        client = _make_client()
        if client is None:
            return _STUB_TEXT

        model = os.environ.get("LLM_MODEL", _DEFAULT_MODEL).strip() or _DEFAULT_MODEL
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.4,
        )
        return response.choices[0].message.content or _STUB_TEXT
    except Exception as exc:
        logger.warning("LLM call failed (%s): %s — returning stub", type(exc).__name__, exc)
        return _STUB_TEXT
