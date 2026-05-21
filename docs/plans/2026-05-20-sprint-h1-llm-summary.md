# Sprint H1 — LLM Semantic Summary

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate a structured semantic summary of each session (Kurzüberblick → Hauptthemen → was A/B sagte → Gesprächsdynamik → Vereinbarungen → offene Fragen → nächste Schritte) via LLM, store it alongside the transcript, and expose download links in the FinishedSessionView.

**Architecture:** New `backend/llm_client.py` abstracts OpenAI / OpenRouter behind a single `call_llm(prompt)` function; `transcription.py` gains `summarize_transcript()` which calls it; `_run_transcription()` calls summarize after Whisper and stores `summary.md`; new `GET /sessions/{id}/summary.md` endpoint; frontend `FinishedSessionView` shows two static links (transcript.md + summary.md) once upload succeeds. No polling — links are provided immediately after upload so the user can check them when transcription finishes.

**Tech Stack:** Python / FastAPI / Pydantic v2 / OpenAI SDK (supports both openai.com and OpenRouter base URLs) / React 19 / TypeScript / Vitest

---

## Task 1 — LLM client abstraction (`backend/llm_client.py`)

**Files:**
- Create: `backend/llm_client.py`
- Create: `backend/tests/test_llm_client.py`

### Context

Currently `transcription.py` hardcodes `openai.OpenAI()` for Whisper. The summary LLM needs the same client but with configurable:
- `OPENAI_API_KEY` → `base_url=https://api.openai.com/v1` (default)
- `OPENROUTER_API_KEY` → `base_url=https://openrouter.ai/api/v1`
- `LLM_MODEL` → which model (default: `gpt-4o-mini`)

When neither key is set, `call_llm()` returns a stub string so the pipeline keeps working.

**Step 1: Write the failing test**

Create `backend/tests/test_llm_client.py`:

```python
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
```

**Step 2: Run test — confirm failure**

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime/backend
python -m pytest tests/test_llm_client.py -v 2>&1
```

Expected: `ModuleNotFoundError: No module named 'llm_client'`

**Step 3: Implement `backend/llm_client.py`**

```python
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
```

**Step 4: Run test — confirm green**

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime/backend
python -m pytest tests/test_llm_client.py -v 2>&1
```

Expected: 4/4 PASSED.

**Step 5: Commit**

```bash
git add backend/llm_client.py backend/tests/test_llm_client.py
git commit -m "feat: add LLM client abstraction (OpenAI + OpenRouter + stub fallback)"
```

---

## Task 2 — Semantic summary function (`backend/transcription.py`)

**Files:**
- Modify: `backend/transcription.py` (add `summarize_transcript()` + update `render_transcript_markdown`)
- Create: `backend/tests/test_summary.py`

### Context

`summarize_transcript()` takes the transcript turns and session metadata, builds a prompt, calls `llm_client.call_llm()`, and returns a summary string. The full markdown output from `render_transcript_markdown` is updated to include summary sections before the Phase Timeline table.

The summary prompt instructs the LLM to:
- Respond in the same language as the transcript
- Phrase dynamics as observable communication structure, NOT psychological diagnosis
- Produce exactly these sections: Kurzüberblick, Hauptthemen, Was {name_a} sagte, Was {name_b} sagte, Gesprächsdynamik, Vereinbarungen, Offene Fragen, Nächste Schritte

**Step 1: Write the failing tests**

Create `backend/tests/test_summary.py`:

```python
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
    assert len(result) > 0  # non-empty even as stub


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
    assert "unheard" in captured_prompt[0]  # transcript text is included


def test_render_transcript_markdown_includes_summary():
    """render_transcript_markdown embeds summary sections in the output."""
    from transcription import render_transcript_markdown, summarize_transcript
    transcript = _make_transcript()

    with patch("transcription.call_llm", return_value="## Hauptthemen\nTopic 1"):
        md = render_transcript_markdown(
            mode_name="Commitment",
            name_a="Alex",
            name_b="Bea",
            result=transcript,
            created_at_iso="2026-05-20T12:00:00+00:00",
        )

    assert "## Hauptthemen" in md
    assert "Topic 1" in md
    assert "## Phase Timeline" in md  # existing section still present
    assert "## Transkript" in md      # existing section still present
```

**Step 2: Run tests — confirm failure**

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime/backend
python -m pytest tests/test_summary.py -v 2>&1
```

Expected: `ImportError` or `AttributeError` — `summarize_transcript` not defined yet.

**Step 3: Add `summarize_transcript()` to `backend/transcription.py`**

At the top of the file, add the import after the existing imports (after line 13):

```python
from llm_client import call_llm
```

After the `_speaker_for_phase()` function (before the `# Alignment` section), insert:

```python
# ---------------------------------------------------------------------------
# LLM semantic summary
# ---------------------------------------------------------------------------

_SUMMARY_SYSTEM = (
    "You are an expert couples communication analyst. "
    "Describe only observable communication patterns and content — "
    "do NOT make psychological diagnoses or therapeutic recommendations. "
    "Respond in the same language as the transcript."
)

_SUMMARY_SECTION_HEADERS = [
    "Kurzüberblick",
    "Hauptthemen",
    "Was {name_a} sagte",
    "Was {name_b} sagte",
    "Gesprächsdynamik",
    "Vereinbarungen",
    "Offene Fragen",
    "Nächste Schritte",
]


def summarize_transcript(
    transcript: TranscriptResult,
    name_a: str,
    name_b: str,
    mode_name: str,
) -> str:
    """Generate a structured semantic summary via LLM.

    Returns stub text when no LLM key is configured.
    """
    speaking_turns = [t for t in transcript.turns if t.phase_type in _SPEAKING_PHASE_TYPES]
    transcript_text = "\n\n".join(
        f"[{t.speaker} – {t.phase_type}]\n{t.text}"
        for t in speaking_turns
    )

    section_list = "\n".join(
        f"- {h.format(name_a=name_a, name_b=name_b)}"
        for h in _SUMMARY_SECTION_HEADERS
    )

    prompt = (
        f"Session mode: {mode_name}\n"
        f"Participants: {name_a} (Speaker A) and {name_b} (Speaker B)\n\n"
        f"Transcript:\n{transcript_text}\n\n"
        f"Write a structured summary with exactly these sections (use ## headings):\n"
        f"{section_list}\n\n"
        "Keep each section concise (2–5 sentences). "
        "Describe what was said and how communication flowed — no diagnoses, no therapy language."
    )

    return call_llm(prompt, system=_SUMMARY_SYSTEM)
```

**Step 4: Update `render_transcript_markdown()` to embed summary**

Modify the function signature and body in `backend/transcription.py`. The function currently starts at line 277. Replace it entirely:

```python
def render_transcript_markdown(
    mode_name: str,
    name_a: str,
    name_b: str,
    result: TranscriptResult,
    created_at_iso: str,
    summary: str | None = None,
) -> str:
    """Build the structured markdown transcript with optional LLM summary."""
    lines: list[str] = []

    # Header
    lines.append(f"# Session: {mode_name} — {created_at_iso[:10]}")
    lines.append("")

    # Kurzüberblick (stat line)
    speaking_phases = [t for t in result.turns if t.phase_type in _SPEAKING_PHASE_TYPES]
    total_words = sum(len(t.text.split()) for t in speaking_phases)
    lines.append("## Kurzüberblick")
    lines.append("")
    lines.append(
        f"Session mit {name_a} und {name_b} im Modus *{mode_name}*. "
        f"Insgesamt {len(speaking_phases)} Sprechblöcke, ~{total_words} Wörter transkribiert."
    )
    lines.append("")

    # LLM summary sections (injected between stat line and timeline)
    if summary:
        lines.append(summary.strip())
        lines.append("")

    # Phase Timeline table
    lines.append("## Phase Timeline")
    lines.append("")
    lines.append("| Phase | Sprecher/in | Start | Ende | Dauer |")
    lines.append("|---|---|---|---|---|")
    for turn in result.turns:
        duration = turn.end_seconds - turn.start_seconds
        lines.append(
            f"| {turn.phase_type} | {turn.speaker} "
            f"| {_fmt_seconds(turn.start_seconds)} "
            f"| {_fmt_seconds(turn.end_seconds)} "
            f"| {_fmt_seconds(duration)} |"
        )
    lines.append("")

    # Transcript blocks
    lines.append("## Transkript")
    lines.append("")
    for turn in result.turns:
        if turn.phase_type not in _SPEAKING_PHASE_TYPES:
            continue
        header = f"### {turn.speaker} ({turn.phase_type}, {_fmt_seconds(turn.start_seconds)}–{_fmt_seconds(turn.end_seconds)})"
        lines.append(header)
        lines.append("")
        lines.append(turn.text)
        lines.append("")

    return "\n".join(lines)
```

**Step 5: Run tests — confirm green**

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime/backend
python -m pytest tests/test_summary.py tests/test_llm_client.py -v 2>&1
```

Expected: all 7 tests PASS.

**Step 6: Run all backend tests**

```bash
python -m pytest tests/ -v 2>&1
```

Expected: all 11 tests PASS.

**Step 7: Commit**

```bash
git add backend/transcription.py backend/tests/test_summary.py
git commit -m "feat: add LLM semantic summary via summarize_transcript()"
```

---

## Task 3 — Wire summary into pipeline + new endpoint (`backend/`)

**Files:**
- Modify: `backend/main.py` (add `_run_transcription` summary call + new endpoint)
- Modify: `backend/session_store.py` (add `save_summary_md` / `load_summary_md`)
- Modify: `backend/models.py` (add `summary_available: bool` to `SessionDetailResponse`)
- Create: `backend/tests/test_summary_endpoint.py`

### Context

`_run_transcription()` in `main.py` currently calls `render_transcript_markdown()` without summary. We add the `summarize_transcript()` call there. We also need a `GET /sessions/{id}/summary.md` endpoint.

**Step 1: Write the failing tests**

Create `backend/tests/test_summary_endpoint.py`:

```python
"""Tests for GET /sessions/{id}/summary.md endpoint."""
from __future__ import annotations

import sys, os
from datetime import datetime, timezone
from unittest.mock import patch
from fastapi.testclient import TestClient

client = TestClient(__import__("main").app)


def _create_session() -> str:
    """Helper: POST /sessions and return session_id."""
    resp = client.post("/sessions", json={
        "participant_name_a": "Alex",
        "participant_name_b": "Bea",
        "mode_name": "Commitment",
        "mode_id": "commitment",
    })
    assert resp.status_code == 201
    return resp.json()["session_id"]


def test_summary_md_404_when_not_ready():
    """GET /sessions/{id}/summary.md returns 404 when summary not yet generated."""
    sid = _create_session()
    resp = client.get(f"/sessions/{sid}/summary.md")
    assert resp.status_code == 404


def test_session_detail_has_summary_available_false():
    """GET /sessions/{id} includes summary_available: false before transcription."""
    sid = _create_session()
    resp = client.get(f"/sessions/{sid}")
    assert resp.status_code == 200
    assert resp.json()["summary_available"] is False
```

**Step 2: Run tests — confirm failure**

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime/backend
python -m pytest tests/test_summary_endpoint.py -v 2>&1
```

Expected: `KeyError: 'summary_available'` or 404 on missing route.

**Step 3: Add `summary_available` to `backend/models.py`**

In `SessionDetailResponse` (currently line 104–112), add the new field:

```python
class SessionDetailResponse(BaseModel):
    session_id: str
    status: SessionStatus
    created_at: datetime
    mode_name: str
    participant_name_a: str
    participant_name_b: str
    transcript: TranscriptResult | None = None
    summary_available: bool = False
    error: str | None = None
```

**Step 4: Add `save_summary_md` / `load_summary_md` to `backend/session_store.py`**

After `load_transcript_md()` (currently line ~128), insert:

```python
def save_summary_md(session_id: str, content: str) -> None:
    path = _session_dir(session_id) / "summary.md"
    path.write_text(content, encoding="utf-8")


def load_summary_md(session_id: str) -> str | None:
    path = _session_dir(session_id) / "summary.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")
```

**Step 5: Update `backend/main.py`**

**5a.** In `get_session()` (currently line 121–135), update the return statement to include `summary_available`:

```python
@app.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session(session_id: str) -> SessionDetailResponse:
    """Return session metadata and transcript (if available)."""
    meta = _get_or_404(session_id)
    transcript = session_store.load_transcript(session_id)
    summary_available = session_store.load_summary_md(session_id) is not None
    return SessionDetailResponse(
        session_id=meta.session_id,
        status=meta.status,
        created_at=meta.created_at,
        mode_name=meta.mode_name,
        participant_name_a=meta.participant_name_a,
        participant_name_b=meta.participant_name_b,
        transcript=transcript,
        summary_available=summary_available,
        error=meta.error,
    )
```

**5b.** Add new endpoint after `get_transcript_md()`:

```python
@app.get("/sessions/{session_id}/summary.md", response_class=PlainTextResponse)
def get_summary_md(session_id: str) -> str:
    """Return the LLM-generated summary as Markdown."""
    _get_or_404(session_id)
    content = session_store.load_summary_md(session_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Summary not yet available")
    return content
```

**5c.** In `_run_transcription()`, add summary call after `render_transcript_markdown`. Find the section that calls `render_transcript_markdown` (currently around line 212) and update:

```python
        # Generate summary via LLM
        from transcription import summarize_transcript
        summary_text = summarize_transcript(
            transcript=result,
            name_a=meta.participant_name_a,
            name_b=meta.participant_name_b,
            mode_name=meta.mode_name,
        )

        md = transcription_module.render_transcript_markdown(
            mode_name=meta.mode_name,
            name_a=meta.participant_name_a,
            name_b=meta.participant_name_b,
            result=result,
            created_at_iso=meta.created_at.isoformat(),
            summary=summary_text,
        )
        session_store.save_transcript(session_id, result)
        session_store.save_transcript_md(session_id, md)
        session_store.save_summary_md(session_id, summary_text)
```

**Step 6: Run tests — confirm green**

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime/backend
python -m pytest tests/ -v 2>&1
```

Expected: all 13 tests PASS.

**Step 7: Commit**

```bash
git add backend/main.py backend/session_store.py backend/models.py backend/tests/test_summary_endpoint.py
git commit -m "feat: wire LLM summary into transcription pipeline + GET /summary.md endpoint"
```

---

## Task 4 — Frontend summary/transcript links in FinishedSessionView

**Files:**
- Modify: `src/services/VibeMindService.ts` (add `getSummaryMdUrl()` + `getTranscriptMdUrl()`)
- Modify: `src/components/SessionView.tsx` (`FinishedSessionView` — show links)
- Modify: `src/i18n/locales/en/translation.json` (add keys)
- Modify: `src/i18n/locales/de/translation.json` (add keys)

### Context

`SessionContext` already exposes `lastSessionId: string | null` and `uploadStatus`. When `uploadStatus === 'uploaded'` and VibeMind is enabled, we show two links:
- "View transcript" → `{VITE_VIBEMIND_API_URL}/sessions/{lastSessionId}/transcript.md`
- "View summary" → `{VITE_VIBEMIND_API_URL}/sessions/{lastSessionId}/summary.md`

These are static links — no polling. The transcript/summary may not exist yet (still processing), but that's expected: clicking a link that returns 404 while processing is fine for MVP.

**Step 1: Add URL helpers to `src/services/VibeMindService.ts`**

After `getSession()` (end of file), add:

```typescript
/**
 * Construct the direct URL to a session's transcript markdown.
 * Returns null when VibeMind is not configured.
 */
export function getTranscriptMdUrl(sessionId: string): string | null {
  const base = _base()
  if (!base) return null
  return `${base}/sessions/${sessionId}/transcript.md`
}

/**
 * Construct the direct URL to a session's summary markdown.
 * Returns null when VibeMind is not configured.
 */
export function getSummaryMdUrl(sessionId: string): string | null {
  const base = _base()
  if (!base) return null
  return `${base}/sessions/${sessionId}/summary.md`
}
```

**Step 2: Add i18n keys**

In `src/i18n/locales/en/translation.json`, add inside `"session"` → `"finished"`:
```json
"viewTranscript": "View transcript",
"viewSummary": "View summary",
"transcriptNote": "Links become available once processing completes (~1–2 min)"
```

In `src/i18n/locales/de/translation.json`, add inside `"session"` → `"finished"`:
```json
"viewTranscript": "Transkript öffnen",
"viewSummary": "Zusammenfassung öffnen",
"transcriptNote": "Links werden verfügbar sobald die Verarbeitung abgeschlossen ist (~1–2 Min.)"
```

**Step 3: Update `FinishedSessionView` in `src/components/SessionView.tsx`**

Import the new functions at top of file (after existing VibeMindService imports):
```typescript
import { isVibeMindEnabled, getTranscriptMdUrl, getSummaryMdUrl } from '../services/VibeMindService'
```

In `FinishedSessionView`, update the destructure to include `lastSessionId`:
```typescript
const { stop, uploadStatus, lastSessionId } = useSession()
```

Replace the `{uploadStatus === 'uploaded' && ...}` block with:
```tsx
{uploadStatus === 'uploaded' && (
  <div className="space-y-2">
    <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
      <CheckCircleIcon className="w-4 h-4" />
      <span>Session saved — transcript processing</span>
    </div>
    {lastSessionId && (
      <div className="flex flex-col gap-2 pt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {t('session.finished.transcriptNote', 'Links become available once processing completes (~1–2 min)')}
        </p>
        <div className="flex gap-2 justify-center">
          <a
            href={getTranscriptMdUrl(lastSessionId) ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('session.finished.viewTranscript', 'View transcript')}
          </a>
          <a
            href={getSummaryMdUrl(lastSessionId) ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            {t('session.finished.viewSummary', 'View summary')}
          </a>
        </div>
      </div>
    )}
  </div>
)}
```

**Step 4: Write tests for new VibeMindService functions**

In `src/services/__tests__/` create `VibeMindService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock import.meta.env before importing the module
vi.stubEnv('VITE_VIBEMIND_API_URL', 'https://api.example.com')

// Re-import after env stub
const { getTranscriptMdUrl, getSummaryMdUrl, isVibeMindEnabled } = await import('../VibeMindService')

describe('VibeMindService URL helpers', () => {
  it('getTranscriptMdUrl returns correct URL', () => {
    expect(getTranscriptMdUrl('abc123')).toBe('https://api.example.com/sessions/abc123/transcript.md')
  })

  it('getSummaryMdUrl returns correct URL', () => {
    expect(getSummaryMdUrl('abc123')).toBe('https://api.example.com/sessions/abc123/summary.md')
  })

  it('isVibeMindEnabled returns true when URL is set', () => {
    expect(isVibeMindEnabled()).toBe(true)
  })
})

describe('VibeMindService URL helpers — no base URL', () => {
  it('getTranscriptMdUrl returns null when no URL configured', async () => {
    vi.stubEnv('VITE_VIBEMIND_API_URL', '')
    const { getTranscriptMdUrl } = await import('../VibeMindService?nocache=' + Date.now())
    expect(getTranscriptMdUrl('abc123')).toBeNull()
  })
})
```

**Step 5: Run frontend tests**

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime
npm run test:run 2>&1 | tail -10
```

Expected: 0 failed. (The VibeMindService test may need adjustment if `vi.stubEnv` + dynamic import doesn't work in the project's test setup — adjust test to mock the module instead if needed.)

**Step 6: Run typecheck**

```bash
npm run typecheck 2>&1
```

Expected: no errors.

**Step 7: Commit**

```bash
git add src/services/VibeMindService.ts src/components/SessionView.tsx \
        src/i18n/locales/en/translation.json src/i18n/locales/de/translation.json \
        src/services/__tests__/VibeMindService.test.ts
git commit -m "feat: show transcript + summary links in FinishedSessionView"
git push
```

---

## Push all and verify

After all 4 tasks committed:

```bash
git push
```

**Manual end-to-end test (after Railway redeploy):**
1. Open https://c-timer.machinetool.site
2. Enable recording → run a session to completion
3. FinishedSessionView shows "Session saved — transcript processing"
4. Two links appear: "View transcript" and "View summary"
5. After ~1–2 min, clicking either link opens the markdown in a new tab

**Railway env vars required:**
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY` — for real summaries
- `LLM_MODEL` — optional (defaults to `gpt-4o-mini`)
- `STORAGE_PATH=/data/vibemind-sessions` — requires volume mounted at `/data`
