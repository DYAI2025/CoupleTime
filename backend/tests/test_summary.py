"""Tests for semantic summary generation."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import patch

from models import TranscriptResult, TranscriptTurn


def _make_transcript(name_a: str = "Alex", name_b: str = "Bea") -> TranscriptResult:
    return TranscriptResult(
        session_id="test-123",
        turns=[
            TranscriptTurn(
                phase_type="slotA",
                speaker=name_a,
                start_seconds=0.0,
                end_seconds=300.0,
                text="Alex talked about feeling unheard lately.",
            ),
            TranscriptTurn(
                phase_type="slotB",
                speaker=name_b,
                start_seconds=300.0,
                end_seconds=600.0,
                text="Bea shared her perspective on communication.",
            ),
        ],
        generated_at=datetime(2026, 5, 20, 12, 0, 0, tzinfo=timezone.utc),
    )


def test_summarize_returns_stub_without_key(monkeypatch):
    """summarize_transcript returns stub text when no LLM key is configured."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    from transcription import summarize_transcript
    result = summarize_transcript(
        transcript=_make_transcript(),
        name_a="Alex",
        name_b="Bea",
        mode_name="Commitment",
    )
    assert isinstance(result, str)
    assert len(result) > 0


def test_summarize_calls_llm_with_transcript_content(monkeypatch):
    """summarize_transcript passes speaker names and transcript text to LLM."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    captured_prompt: list[str] = []

    def fake_call_llm(prompt: str, **kwargs: object) -> str:
        captured_prompt.append(prompt)
        return "## Kurzüberblick\nTest summary."

    with patch("transcription.call_llm", fake_call_llm):
        from transcription import summarize_transcript
        summarize_transcript(
            transcript=_make_transcript(),
            name_a="Alex",
            name_b="Bea",
            mode_name="Commitment",
        )

    assert len(captured_prompt) == 1
    assert "Alex" in captured_prompt[0]
    assert "Bea" in captured_prompt[0]
    assert "unheard" in captured_prompt[0]


def test_render_transcript_markdown_includes_summary():
    """render_transcript_markdown embeds summary sections when summary is passed."""
    from transcription import render_transcript_markdown
    transcript = _make_transcript()

    md = render_transcript_markdown(
        mode_name="Commitment",
        name_a="Alex",
        name_b="Bea",
        result=transcript,
        created_at_iso="2026-05-20T12:00:00+00:00",
        summary="## Hauptthemen\nTopic 1",
    )

    assert "## Hauptthemen" in md
    assert "Topic 1" in md
    assert "## Phase Timeline" in md
    assert "## Transkript" in md
