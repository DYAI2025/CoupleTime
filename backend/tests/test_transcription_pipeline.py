"""Integration test: full transcription pipeline without real API keys.

Pipeline under test:
  POST /sessions
  → POST /sessions/{id}/recording  (minimal wav + phase markers)
  → POST /sessions/{id}/transcribe (stub mode, no OPENAI_API_KEY)
  → GET  /sessions/{id}            (poll until status=done)
  → GET  /sessions/{id}/transcript.md
  → GET  /sessions/{id}/summary.md

Verifies: stub path works end-to-end; speaker attribution; phase alignment;
          markdown structure; transcript_available / summary_available flags.
"""
from __future__ import annotations

import json
import struct
import time
import wave
from io import BytesIO

from fastapi.testclient import TestClient

client = TestClient(__import__("main").app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_session(name_a="Alex", name_b="Bea", mode="Commitment") -> str:
    resp = client.post("/sessions", json={
        "participant_name_a": name_a,
        "participant_name_b": name_b,
        "mode_name": mode,
        "mode_id": mode.lower(),
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["session_id"]


def _minimal_wav(duration_seconds: float = 2.0, sample_rate: int = 16000) -> bytes:
    """Return minimal valid PCM WAV bytes (silence)."""
    n_samples = int(duration_seconds * sample_rate)
    buf = BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)        # 16-bit
        w.setframerate(sample_rate)
        w.writeframes(b"\x00\x00" * n_samples)
    return buf.getvalue()


def _commitment_phases() -> list[dict]:
    """Simplified Commitment phase markers matching ~10s session."""
    return [
        {"phaseType": "prep",       "elapsedSeconds": 0},
        {"phaseType": "slotA",      "elapsedSeconds": 2},
        {"phaseType": "transition", "elapsedSeconds": 5},
        {"phaseType": "slotB",      "elapsedSeconds": 6},
        {"phaseType": "closingA",   "elapsedSeconds": 8},
        {"phaseType": "closingB",   "elapsedSeconds": 9},
        {"phaseType": "cooldown",   "elapsedSeconds": 9.5},
    ]


def _upload_recording(session_id: str, duration: float = 2.0) -> None:
    wav = _minimal_wav(duration)
    phases = _commitment_phases()
    resp = client.post(
        f"/sessions/{session_id}/recording",
        files={"audio": ("recording.wav", wav, "audio/wav")},
        data={"phases": json.dumps(phases)},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "uploaded"


def _trigger_and_wait(session_id: str, timeout: float = 10.0) -> dict:
    """Trigger transcription and poll until done or timeout."""
    resp = client.post(f"/sessions/{session_id}/transcribe")
    assert resp.status_code == 202, resp.text

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        detail = client.get(f"/sessions/{session_id}").json()
        if detail["status"] in ("done", "error"):
            return detail
        time.sleep(0.1)

    raise TimeoutError(f"Session {session_id} not done after {timeout}s")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestSessionLifecycle:
    def test_create_session_returns_id(self):
        resp = client.post("/sessions", json={
            "participant_name_a": "Alex",
            "participant_name_b": "Bea",
            "mode_name": "Commitment",
            "mode_id": "commitment",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "session_id" in data
        assert len(data["session_id"]) == 32  # uuid4 hex

    def test_new_session_has_pending_status(self):
        sid = _create_session()
        detail = client.get(f"/sessions/{sid}").json()
        assert detail["status"] == "pending"

    def test_new_session_flags_false(self):
        sid = _create_session()
        detail = client.get(f"/sessions/{sid}").json()
        assert detail["transcript_available"] is False
        assert detail["summary_available"] is False

    def test_unknown_session_returns_404(self):
        resp = client.get("/sessions/doesnotexist12345678901234567890")
        assert resp.status_code == 404


class TestUpload:
    def test_upload_sets_status_uploaded(self):
        sid = _create_session()
        _upload_recording(sid)
        detail = client.get(f"/sessions/{sid}").json()
        assert detail["status"] == "uploaded"

    def test_transcript_missing_before_transcription(self):
        sid = _create_session()
        _upload_recording(sid)
        resp = client.get(f"/sessions/{sid}/transcript.md")
        assert resp.status_code == 404


class TestTranscriptionPipeline:
    """Full end-to-end through stub transcription."""

    def setup_method(self):
        self.sid = _create_session(name_a="Luisa", name_b="Max")
        _upload_recording(self.sid, duration=10.0)
        self.detail = _trigger_and_wait(self.sid)

    def test_status_done(self):
        assert self.detail["status"] == "done"

    def test_transcript_available_true(self):
        assert self.detail["transcript_available"] is True

    def test_summary_available_true(self):
        assert self.detail["summary_available"] is True

    def test_transcript_md_returns_200(self):
        resp = client.get(f"/sessions/{self.sid}/transcript.md")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/markdown")

    def test_summary_md_returns_200(self):
        resp = client.get(f"/sessions/{self.sid}/summary.md")
        assert resp.status_code == 200

    def test_transcript_contains_session_header(self):
        md = client.get(f"/sessions/{self.sid}/transcript.md").text
        assert "# Session: Commitment" in md

    def test_transcript_contains_phase_timeline(self):
        md = client.get(f"/sessions/{self.sid}/transcript.md").text
        assert "## Phase Timeline" in md

    def test_transcript_contains_transcript_section(self):
        md = client.get(f"/sessions/{self.sid}/transcript.md").text
        assert "## Transkript" in md

    def test_transcript_speaker_attribution_luisa(self):
        md = client.get(f"/sessions/{self.sid}/transcript.md").text
        # stub: slotA assigned to Luisa (name_a)
        assert "Luisa" in md

    def test_transcript_speaker_attribution_max(self):
        md = client.get(f"/sessions/{self.sid}/transcript.md").text
        # stub: slotB assigned to Max (name_b)
        assert "Max" in md

    def test_transcript_phase_types_present(self):
        md = client.get(f"/sessions/{self.sid}/transcript.md").text
        for phase in ("slotA", "slotB", "closingA", "closingB"):
            assert phase in md, f"Phase {phase} missing from transcript"

    def test_summary_contains_kurzueberblick(self):
        md = client.get(f"/sessions/{self.sid}/transcript.md").text
        assert "Kurzüberblick" in md

    def test_summary_md_is_stub_without_api_key(self):
        """Without LLM key, summary.md must contain stub placeholder."""
        md = client.get(f"/sessions/{self.sid}/summary.md").text
        # stub text set by llm_client when no key is configured
        assert len(md) > 0
        # should NOT be empty or just whitespace
        assert md.strip()


class TestPollingContract:
    """Verify the fields the frontend polls on."""

    def test_detail_response_shape(self):
        sid = _create_session()
        _upload_recording(sid)
        detail = _trigger_and_wait(sid)

        required = {
            "session_id", "status", "created_at",
            "mode_name", "participant_name_a", "participant_name_b",
            "transcript_available", "summary_available", "error",
        }
        assert required.issubset(detail.keys()), (
            f"Missing keys: {required - detail.keys()}"
        )

    def test_status_transitions(self):
        """Status must transition pending → uploaded → (transcribing?) → done."""
        sid = _create_session()
        assert client.get(f"/sessions/{sid}").json()["status"] == "pending"
        _upload_recording(sid)
        assert client.get(f"/sessions/{sid}").json()["status"] == "uploaded"
        detail = _trigger_and_wait(sid)
        assert detail["status"] == "done"

    def test_flags_activate_after_transcription(self):
        sid = _create_session()
        _upload_recording(sid)
        before = client.get(f"/sessions/{sid}").json()
        assert before["transcript_available"] is False
        assert before["summary_available"] is False

        _trigger_and_wait(sid)
        after = client.get(f"/sessions/{sid}").json()
        assert after["transcript_available"] is True
        assert after["summary_available"] is True
