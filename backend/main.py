"""VibeMind FastAPI backend for CoupleTimer sessions."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

from fastapi import BackgroundTasks, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, RedirectResponse

import session_store
import transcription as transcription_module
from models import (
    PhaseMarker,
    SessionCreateRequest,
    SessionCreateResponse,
    SessionDetailResponse,
    SessionStatus,
    TranscribeResponse,
    UploadResponse,
)

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VibeMind",
    description="Session audio processing backend for CoupleTimer",
    version="0.1.0",
)

_ALLOWED_ORIGINS = [
    "https://c-timer.machinetool.site",
    "http://localhost:5173",
    "http://localhost:4173",
]

if os.environ.get("CORS_ALLOW_ALL", "").lower() in ("1", "true", "yes"):
    _ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, str]:
    """Simple liveness probe."""
    return {"status": "ok"}


@app.get("/")
def root() -> RedirectResponse:
    """Redirect humans to interactive API docs."""
    return RedirectResponse(url="/docs")


@app.post("/sessions", response_model=SessionCreateResponse, status_code=201)
def create_session(body: SessionCreateRequest) -> SessionCreateResponse:
    """Create a new session record and return its ID."""
    meta = session_store.create_session(
        participant_name_a=body.participant_name_a,
        participant_name_b=body.participant_name_b,
        mode_name=body.mode_name,
        mode_id=body.mode_id,
    )
    return SessionCreateResponse(
        session_id=meta.session_id,
        created_at=meta.created_at,
    )


@app.post("/sessions/{session_id}/recording", response_model=UploadResponse)
async def upload_recording(
    session_id: str,
    audio: UploadFile,
    phases: str,
) -> UploadResponse:
    """Receive the audio file and phase markers.

    - `audio`: multipart file upload
    - `phases`: JSON-encoded list of PhaseMarker objects (form field)
    """
    meta = _get_or_404(session_id)

    # Parse phase markers
    try:
        raw_phases = json.loads(phases)
        markers = [PhaseMarker.model_validate(p) for p in raw_phases]
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid phases JSON: {exc}") from exc

    # Determine file extension from content type
    content_type = audio.content_type or ""
    if "mp4" in content_type:
        suffix = ".mp4"
    elif "ogg" in content_type:
        suffix = ".ogg"
    elif "wav" in content_type:
        suffix = ".wav"
    else:
        suffix = ".webm"

    audio_bytes = await audio.read()
    session_store.save_recording(session_id, audio_bytes, suffix)
    session_store.save_phases(session_id, markers)

    meta.status = SessionStatus.uploaded
    meta.uploaded_at = datetime.now(timezone.utc)
    session_store.update_session(meta)

    return UploadResponse(session_id=session_id, status="uploaded")


@app.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session(session_id: str) -> SessionDetailResponse:
    """Return session metadata and transcript (if available)."""
    meta = _get_or_404(session_id)
    transcript = session_store.load_transcript(session_id)
    return SessionDetailResponse(
        session_id=meta.session_id,
        status=meta.status,
        created_at=meta.created_at,
        mode_name=meta.mode_name,
        participant_name_a=meta.participant_name_a,
        participant_name_b=meta.participant_name_b,
        transcript=transcript,
        error=meta.error,
    )


@app.post("/sessions/{session_id}/transcribe", response_model=TranscribeResponse)
def trigger_transcription(
    session_id: str,
    background_tasks: BackgroundTasks,
) -> TranscribeResponse:
    """Start async transcription. Returns immediately with status 'transcribing'."""
    meta = _get_or_404(session_id)

    if meta.status == SessionStatus.transcribing:
        return TranscribeResponse(
            session_id=session_id,
            status="transcribing",
            message="Transcription already in progress",
        )

    if meta.status == SessionStatus.done:
        return TranscribeResponse(
            session_id=session_id,
            status="done",
            message="Transcript already available",
        )

    meta.status = SessionStatus.transcribing
    session_store.update_session(meta)

    background_tasks.add_task(_run_transcription, session_id)

    return TranscribeResponse(
        session_id=session_id,
        status="transcribing",
        message="Transcription started",
    )


@app.get("/sessions/{session_id}/transcript.md", response_class=PlainTextResponse)
def get_transcript_md(session_id: str) -> str:
    """Return the formatted Markdown transcript."""
    _get_or_404(session_id)
    content = session_store.load_transcript_md(session_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Transcript not yet available")
    return content


# ---------------------------------------------------------------------------
# Background task
# ---------------------------------------------------------------------------


def _run_transcription(session_id: str) -> None:
    """Execute transcription synchronously inside a background task thread."""
    meta = session_store.get_session(session_id)
    if meta is None:
        return

    recording_path = session_store.get_recording_path(session_id)
    if recording_path is None:
        meta.status = SessionStatus.error
        meta.error = "No recording file found"
        session_store.update_session(meta)
        return

    markers = session_store.load_phases(session_id)

    try:
        result = transcription_module.transcribe_session(
            session_id=session_id,
            recording_path=recording_path,
            markers=markers,
            name_a=meta.participant_name_a,
            name_b=meta.participant_name_b,
        )
        session_store.save_transcript(session_id, result)

        md = transcription_module.render_transcript_markdown(
            mode_name=meta.mode_name,
            name_a=meta.participant_name_a,
            name_b=meta.participant_name_b,
            result=result,
            created_at_iso=meta.created_at.isoformat(),
        )
        session_store.save_transcript_md(session_id, md)

        meta.status = SessionStatus.done
        meta.transcribed_at = datetime.now(timezone.utc)
        meta.error = None

    except Exception as exc:
        meta.status = SessionStatus.error
        meta.error = str(exc)

    session_store.update_session(meta)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_or_404(session_id: str):  # type: ignore[return]
    meta = session_store.get_session(session_id)
    if meta is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return meta
