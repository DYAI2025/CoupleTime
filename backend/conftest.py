"""pytest configuration — add backend/ to sys.path for all test modules."""
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))


@pytest.fixture(autouse=True)
def _clear_openai_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """Remove OPENAI_API_KEY so tests always exercise the stub path."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
