"""Test that session_store warns when STORAGE_PATH is /tmp (ephemeral)."""
from __future__ import annotations

import importlib
import logging


def test_warns_on_tmp_storage_path(monkeypatch, caplog, tmp_path):
    """_storage_root() should warn when STORAGE_PATH starts with /tmp."""
    monkeypatch.setenv("STORAGE_PATH", "/tmp/vibemind-test")

    import session_store
    importlib.reload(session_store)  # pick up the monkeypatched env var

    with caplog.at_level(logging.WARNING, logger="session_store"):
        session_store._storage_root()

    assert any(
        "/tmp" in record.message or "ephemeral" in record.message.lower()
        for record in caplog.records
    )


def test_no_warning_on_persistent_path(monkeypatch, caplog, tmp_path):
    """_storage_root() should NOT warn when STORAGE_PATH is a non-/tmp path."""
    monkeypatch.setenv("STORAGE_PATH", str(tmp_path / "vibemind-data"))

    import session_store
    importlib.reload(session_store)

    with caplog.at_level(logging.WARNING, logger="session_store"):
        session_store._storage_root()

    assert not any(
        "ephemeral" in record.message.lower()
        for record in caplog.records
    )
