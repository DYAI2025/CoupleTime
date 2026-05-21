"""Filesystem-based session store.

Each session lives in {STORAGE_PATH}/{session_id}/ with:
  session.json   — SessionMeta
  recording.webm — audio file
  phases.json    — list[PhaseMarker]
  transcript.json — TranscriptResult (once done)
  transcript.md   — formatted markdown
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger("session_store")
_ephemeral_warned = False

from models import (
    PhaseMarker,
    SessionMeta,
    SessionStatus,
    TranscriptResult,
)


def _storage_root() -> Path:
    global _ephemeral_warned
    raw = os.environ.get("STORAGE_PATH", "/tmp/vibemind")
    if raw.startswith("/tmp") and not _ephemeral_warned:
        _ephemeral_warned = True
        logger.warning(
            "STORAGE_PATH=%s is ephemeral — sessions will be lost on redeploy. "
            "Set STORAGE_PATH to a Railway volume mount (e.g. /data/vibemind-sessions).",
            raw,
        )
    p = Path(raw)
    p.mkdir(parents=True, exist_ok=True)
    return p


def _session_dir(session_id: str) -> Path:
    d = _storage_root() / session_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _meta_path(session_id: str) -> Path:
    return _session_dir(session_id) / "session.json"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_session(
    participant_name_a: str,
    participant_name_b: str,
    mode_name: str,
    mode_id: str,
) -> SessionMeta:
    session_id = uuid.uuid4().hex
    meta = SessionMeta(
        session_id=session_id,
        participant_name_a=participant_name_a,
        participant_name_b=participant_name_b,
        mode_name=mode_name,
        mode_id=mode_id,
        status=SessionStatus.pending,
        created_at=datetime.now(timezone.utc),
    )
    _write_meta(meta)
    return meta


def get_session(session_id: str) -> SessionMeta | None:
    path = _meta_path(session_id)
    if not path.exists():
        return None
    return SessionMeta.model_validate_json(path.read_text())


def update_session(meta: SessionMeta) -> None:
    _write_meta(meta)


def save_recording(session_id: str, audio_bytes: bytes, audio_suffix: str) -> Path:
    """Write the raw audio bytes and return the path."""
    dest = _session_dir(session_id) / f"recording{audio_suffix}"
    dest.write_bytes(audio_bytes)
    return dest


def save_phases(session_id: str, markers: list[PhaseMarker]) -> None:
    path = _session_dir(session_id) / "phases.json"
    path.write_text(
        json.dumps([m.model_dump() for m in markers], ensure_ascii=False, indent=2)
    )


def load_phases(session_id: str) -> list[PhaseMarker]:
    path = _session_dir(session_id) / "phases.json"
    if not path.exists():
        return []
    raw = json.loads(path.read_text())
    return [PhaseMarker.model_validate(r) for r in raw]


def get_recording_path(session_id: str) -> Path | None:
    """Return the recording file path regardless of extension, or None."""
    d = _session_dir(session_id)
    for ext in (".webm", ".mp4", ".ogg", ".wav"):
        p = d / f"recording{ext}"
        if p.exists():
            return p
    return None


def save_transcript(session_id: str, result: TranscriptResult) -> None:
    path = _session_dir(session_id) / "transcript.json"
    path.write_text(result.model_dump_json(indent=2))


def load_transcript(session_id: str) -> TranscriptResult | None:
    path = _session_dir(session_id) / "transcript.json"
    if not path.exists():
        return None
    return TranscriptResult.model_validate_json(path.read_text())


def save_transcript_md(session_id: str, content: str) -> None:
    path = _session_dir(session_id) / "transcript.md"
    path.write_text(content, encoding="utf-8")


def load_transcript_md(session_id: str) -> str | None:
    path = _session_dir(session_id) / "transcript.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def save_summary_md(session_id: str, content: str) -> None:
    path = _session_dir(session_id) / "summary.md"
    path.write_text(content, encoding="utf-8")


def load_summary_md(session_id: str) -> str | None:
    path = _session_dir(session_id) / "summary.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _write_meta(meta: SessionMeta) -> None:
    _meta_path(meta.session_id).write_text(
        meta.model_dump_json(indent=2)
    )
