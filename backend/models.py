"""Pydantic v2 data models for VibeMind backend."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Phase markers (mirrored from the frontend AudioRecorderService)
# ---------------------------------------------------------------------------

class PhaseMarker(BaseModel):
    phaseType: str
    elapsedSeconds: float
    timestamp: int  # epoch ms from frontend Date.now()


# ---------------------------------------------------------------------------
# Session lifecycle
# ---------------------------------------------------------------------------

class SessionStatus(str, Enum):
    pending = "pending"
    uploaded = "uploaded"
    transcribing = "transcribing"
    done = "done"
    error = "error"


class SessionCreateRequest(BaseModel):
    participant_name_a: str = Field(..., min_length=1, max_length=100)
    participant_name_b: str = Field(..., min_length=1, max_length=100)
    mode_name: str = Field(..., min_length=1, max_length=100)
    mode_id: str = Field(..., min_length=1, max_length=100)


class SessionCreateResponse(BaseModel):
    session_id: str
    created_at: datetime


class UploadResponse(BaseModel):
    session_id: str
    status: Literal["uploaded"]


class TranscribeResponse(BaseModel):
    session_id: str
    status: Literal["transcribing", "done"]
    message: str


# ---------------------------------------------------------------------------
# Session metadata (stored as session.json)
# ---------------------------------------------------------------------------

class SessionMeta(BaseModel):
    session_id: str
    participant_name_a: str
    participant_name_b: str
    mode_name: str
    mode_id: str
    status: SessionStatus = SessionStatus.pending
    created_at: datetime
    uploaded_at: datetime | None = None
    transcribed_at: datetime | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# Transcription / Whisper segment
# ---------------------------------------------------------------------------

class WhisperSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str


class TranscriptTurn(BaseModel):
    """A block of text attributed to a phase window and speaker."""
    phase_type: str
    speaker: str  # nameA, nameB, or "—"
    start_seconds: float
    end_seconds: float
    text: str


class TranscriptResult(BaseModel):
    session_id: str
    turns: list[TranscriptTurn]
    generated_at: datetime


# ---------------------------------------------------------------------------
# GET /sessions/{id} response
# ---------------------------------------------------------------------------

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
