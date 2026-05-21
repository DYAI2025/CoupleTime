"""Tests for LLM client abstraction."""
from __future__ import annotations

import importlib
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def reload_module():
    """Reload llm_client after each test to reset module-level state."""
    yield
    import llm_client
    importlib.reload(llm_client)


def test_stub_when_no_keys(monkeypatch):
    """call_llm returns stub text when no API keys are set."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    import llm_client
    importlib.reload(llm_client)

    result = llm_client.call_llm("summarize this")
    assert "[LLM stub" in result


def test_uses_openai_key(monkeypatch):
    """call_llm uses OpenAI when OPENAI_API_KEY is set."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.setenv("LLM_MODEL", "gpt-4o-mini")

    import llm_client
    importlib.reload(llm_client)

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content="summary text"))
    ]

    with patch("llm_client._make_client", return_value=mock_client):
        result = llm_client.call_llm("summarize this")

    assert result == "summary text"


def test_uses_openrouter_when_no_openai(monkeypatch):
    """call_llm uses OpenRouter base URL when only OPENROUTER_API_KEY is set."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-test")
    monkeypatch.setenv("LLM_MODEL", "openai/gpt-4o-mini")

    import llm_client
    importlib.reload(llm_client)

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content="openrouter summary"))
    ]

    with patch("llm_client._make_client", return_value=mock_client):
        result = llm_client.call_llm("summarize this")

    assert result == "openrouter summary"


def test_returns_stub_on_api_error(monkeypatch):
    """call_llm returns stub text if the API call raises an exception."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    import llm_client
    importlib.reload(llm_client)

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RuntimeError("API down")

    with patch("llm_client._make_client", return_value=mock_client):
        result = llm_client.call_llm("summarize this")

    assert "[LLM stub" in result
