"""Tests for GET /sessions/{id}/summary.md endpoint and summary_available field."""
from __future__ import annotations

from fastapi.testclient import TestClient

client = TestClient(__import__("main").app)


def _create_session() -> str:
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
