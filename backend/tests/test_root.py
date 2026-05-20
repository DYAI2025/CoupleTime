"""Tests for root redirect and health endpoint."""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from main import app

client_no_redirect = TestClient(app, follow_redirects=False)
client = TestClient(app)


def test_root_redirects_to_docs():
    response = client_no_redirect.get("/")
    assert response.status_code in (307, 308)
    assert response.headers["location"] == "/docs"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
