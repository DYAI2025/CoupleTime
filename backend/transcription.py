"""Transcription logic: OpenAI Whisper API + phase alignment.

If OPENAI_API_KEY is not set, returns a deterministic stub transcript so the
pipeline can be tested end-to-end without spending credits.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from models import PhaseMarker, TranscriptResult, TranscriptTurn, WhisperSegment


# ---------------------------------------------------------------------------
# Phase-window helpers
# ---------------------------------------------------------------------------

def _build_phase_windows(
    markers: list[PhaseMarker],
    total_duration_seconds: float,
) -> list[tuple[PhaseMarker, float, float]]:
    """Return (marker, window_start, window_end) tuples.

    Each window starts at marker.elapsedSeconds and ends at the next
    marker's elapsedSeconds (or total_duration_seconds for the last one).
    """
    windows: list[tuple[PhaseMarker, float, float]] = []
    for i, marker in enumerate(markers):
        start = float(marker.elapsedSeconds)
        if i + 1 < len(markers):
            end = float(markers[i + 1].elapsedSeconds)
        else:
            end = total_duration_seconds
        windows.append((marker, start, end))
    return windows


def _assign_segment_to_phase(
    seg_start: float,
    seg_end: float,
    windows: list[tuple[PhaseMarker, float, float]],
) -> PhaseMarker | None:
    """Return the phase marker whose window has the most overlap with [seg_start, seg_end]."""
    best_marker: PhaseMarker | None = None
    best_overlap = 0.0
    for marker, win_start, win_end in windows:
        overlap = max(0.0, min(seg_end, win_end) - max(seg_start, win_start))
        if overlap > best_overlap:
            best_overlap = overlap
            best_marker = marker
    return best_marker


_SPEAKING_PHASE_TYPES = {"slotA", "slotB", "closingA", "closingB"}


def _speaker_for_phase(phase_type: str, name_a: str, name_b: str) -> str:
    if phase_type in ("slotA", "closingA"):
        return name_a
    if phase_type in ("slotB", "closingB"):
        return name_b
    return "—"


# ---------------------------------------------------------------------------
# Alignment: Whisper segments → TranscriptTurns
# ---------------------------------------------------------------------------

def align_segments_to_phases(
    segments: list[WhisperSegment],
    markers: list[PhaseMarker],
    name_a: str,
    name_b: str,
    total_duration_seconds: float,
) -> list[TranscriptTurn]:
    """Align Whisper segments to phase windows.

    Consecutive segments that belong to the same phase are merged into a
    single TranscriptTurn.
    """
    if not markers:
        # No phase info: dump everything into one unnamed turn
        full_text = " ".join(s.text.strip() for s in segments).strip()
        start = segments[0].start if segments else 0.0
        end = segments[-1].end if segments else total_duration_seconds
        return [
            TranscriptTurn(
                phase_type="unknown",
                speaker="—",
                start_seconds=start,
                end_seconds=end,
                text=full_text,
            )
        ]

    windows = _build_phase_windows(markers, total_duration_seconds)

    # Group segments by phase
    grouped: dict[int, list[WhisperSegment]] = {}  # key = index in windows
    window_index: dict[int, tuple[PhaseMarker, float, float]] = {
        i: w for i, w in enumerate(windows)
    }

    for seg in segments:
        marker = _assign_segment_to_phase(seg.start, seg.end, windows)
        if marker is None:
            continue
        # Find the index
        idx = next(
            (i for i, (m, _, _) in enumerate(windows) if m is marker), None
        )
        if idx is None:
            continue
        grouped.setdefault(idx, []).append(seg)

    turns: list[TranscriptTurn] = []
    for idx in sorted(grouped.keys()):
        marker, win_start, win_end = window_index[idx]
        segs = grouped[idx]
        text = " ".join(s.text.strip() for s in segs).strip()
        if not text:
            continue
        turns.append(
            TranscriptTurn(
                phase_type=marker.phaseType,
                speaker=_speaker_for_phase(marker.phaseType, name_a, name_b),
                start_seconds=win_start,
                end_seconds=win_end,
                text=text,
            )
        )

    return turns


# ---------------------------------------------------------------------------
# Stub transcript (no API key)
# ---------------------------------------------------------------------------

def _stub_transcript(
    session_id: str,
    markers: list[PhaseMarker],
    name_a: str,
    name_b: str,
    total_duration_seconds: float,
) -> TranscriptResult:
    """Return a deterministic stub for development / testing."""
    windows = _build_phase_windows(markers, total_duration_seconds) if markers else []
    turns: list[TranscriptTurn] = []

    if not windows:
        turns = [
            TranscriptTurn(
                phase_type="unknown",
                speaker="—",
                start_seconds=0.0,
                end_seconds=total_duration_seconds,
                text="[Stub transcript — no OPENAI_API_KEY set and no phase data available]",
            )
        ]
    else:
        stub_texts: dict[str, str] = {
            "prep": "[Stub: preparation phase — no audio submitted]",
            "slotA": f"[Stub: {name_a} speaking slot — no audio submitted]",
            "slotB": f"[Stub: {name_b} speaking slot — no audio submitted]",
            "transition": "[Stub: transition pause — no audio submitted]",
            "closingA": f"[Stub: {name_a} closing — no audio submitted]",
            "closingB": f"[Stub: {name_b} closing — no audio submitted]",
            "cooldown": "[Stub: cooldown — no audio submitted]",
        }
        for marker, win_start, win_end in windows:
            text = stub_texts.get(
                marker.phaseType,
                f"[Stub: {marker.phaseType} — no audio submitted]",
            )
            turns.append(
                TranscriptTurn(
                    phase_type=marker.phaseType,
                    speaker=_speaker_for_phase(marker.phaseType, name_a, name_b),
                    start_seconds=win_start,
                    end_seconds=win_end,
                    text=text,
                )
            )

    return TranscriptResult(
        session_id=session_id,
        turns=turns,
        generated_at=datetime.now(timezone.utc),
    )


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------

def transcribe_session(
    session_id: str,
    recording_path: Path,
    markers: list[PhaseMarker],
    name_a: str,
    name_b: str,
) -> TranscriptResult:
    """Transcribe audio and align to phases.

    Falls back to a stub when OPENAI_API_KEY is not set.
    """
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    file_size = recording_path.stat().st_size if recording_path.exists() else 0

    if not api_key or file_size == 0:
        # Use stub: either no key, or empty audio file
        total_duration = float(markers[-1].elapsedSeconds) * 1.1 if markers else 60.0
        return _stub_transcript(session_id, markers, name_a, name_b, total_duration)

    # --- Real Whisper API call ---
    try:
        from openai import OpenAI  # type: ignore[import-untyped]

        client = OpenAI(api_key=api_key)

        with recording_path.open("rb") as f:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        raw_segments: list[WhisperSegment] = []
        if hasattr(response, "segments") and response.segments:
            for s in response.segments:
                raw_segments.append(
                    WhisperSegment(
                        id=int(getattr(s, "id", 0)),
                        start=float(getattr(s, "start", 0.0)),
                        end=float(getattr(s, "end", 0.0)),
                        text=str(getattr(s, "text", "")),
                    )
                )

        # Total duration: last segment end, or last marker * 1.1, or fallback 60s
        if raw_segments:
            total_duration = raw_segments[-1].end
        elif markers:
            total_duration = float(markers[-1].elapsedSeconds) * 1.1
        else:
            total_duration = 60.0

        turns = align_segments_to_phases(
            raw_segments, markers, name_a, name_b, total_duration
        )

        return TranscriptResult(
            session_id=session_id,
            turns=turns,
            generated_at=datetime.now(timezone.utc),
        )

    except Exception as exc:
        # Bubble up as RuntimeError so the endpoint can store error state
        raise RuntimeError(f"Whisper API error: {exc}") from exc


# ---------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------

def _fmt_seconds(seconds: float) -> str:
    total = int(seconds)
    m, s = divmod(total, 60)
    return f"{m}:{s:02d}"


def render_transcript_markdown(
    mode_name: str,
    name_a: str,
    name_b: str,
    result: TranscriptResult,
    created_at_iso: str,
) -> str:
    """Build the structured markdown transcript."""
    lines: list[str] = []

    # Header
    lines.append(f"# Session: {mode_name} — {created_at_iso[:10]}")
    lines.append("")

    # Kurzüberblick
    lines.append("## Kurzüberblick")
    lines.append("")
    speaking_phases = [t for t in result.turns if t.phase_type in _SPEAKING_PHASE_TYPES]
    total_words = sum(len(t.text.split()) for t in speaking_phases)
    lines.append(
        f"Session mit {name_a} und {name_b} im Modus *{mode_name}*. "
        f"Insgesamt {len(speaking_phases)} Sprechblöcke, ~{total_words} Wörter transkribiert."
    )
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
