# Gap Fixes Sprint — C3 + C1/M3 + C2 + M4

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical/medium gaps identified in the gap analysis so the VibeMind pipeline is end-to-end testable: clean CI, Railway root route, frontend wired to backend, sessions persistent across redeploys.

**Architecture:** Four independent fixes sequenced by dependency: tests must pass before CI (Task 1), Railway fixes land before frontend is wired (Tasks 2→3), persistence fix is last because it needs Railway volume set up externally (Task 4). Each task ends with a commit + push.

**Tech Stack:** TypeScript/Vitest (Task 1), Python/FastAPI (Task 2), GitHub Actions (Task 3), Railway volumes + Python (Task 4).

---

## Task 1 — Fix failing SessionView integration test (C3)

**Files:**
- Modify: `src/components/__tests__/SessionView.test.tsx:95–108`

**Root cause:** `startSessionWithMode('commitment')` does a case-sensitive `String.includes('commitment')` against mode card button text, which is `'Commitment'` (capital C). No card is found → mode never selected → no Start button renders → inner `waitFor` resolves without doing anything → session never starts → `'Quick Tips'` never appears → 5 000 ms timeout.

**Step 1: Confirm the failure**

```bash
npm run test -- src/components/__tests__/SessionView.test.tsx 2>&1 | tail -20
```

Expected: `FAIL` with timeout in "shows guidance panel when session is running".

**Step 2: Fix `startSessionWithMode` — case-insensitive match + loud failure**

Replace lines 95–108 in `src/components/__tests__/SessionView.test.tsx`:

```typescript
  async function startSessionWithMode(modeFragment: string) {
    // Case-insensitive search so 'commitment' matches 'Commitment'
    const modeButtons = screen.getAllByRole('button')
    const modeCard = modeButtons.find(btn =>
      btn.textContent?.toLowerCase().includes(modeFragment.toLowerCase()) &&
      !btn.getAttribute('aria-label')
    )
    if (modeCard) fireEvent.click(modeCard)

    // waitFor throws when startButton is undefined → retries until Start button appears
    await waitFor(() => {
      const startButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.toLowerCase().includes('start') ||
        btn.textContent?.toLowerCase().includes('session')
      )
      expect(startButton).toBeDefined()
      fireEvent.click(startButton!)
    })
  }
```

**Step 3: Run tests — verify green**

```bash
npm run test:run 2>&1 | tail -15
```

Expected:
```
Test Files  0 failed | 44 passed (44)
Tests       0 failed | 515 passed
```

**Step 4: Commit**

```bash
git add src/components/__tests__/SessionView.test.tsx
git commit -m "fix: case-insensitive mode card lookup in SessionView test"
git push
```

---

## Task 2 — Root redirect + drop redundant Procfile (C1 + M3)

**Files:**
- Modify: `backend/main.py` (add root route after line 61)
- Delete: `backend/Procfile`

**Why:** `railway.toml` already defines `startCommand`. `Procfile` is redundant and may confuse Railway's builder. Root `/` returns FastAPI 404 → Chrome shows its own "page not found" → confusing. Redirect to `/docs` so humans hitting the URL see something useful.

**Step 1: Write test for root redirect**

Create `backend/tests/test_root.py`:

```python
"""Tests for root redirect and health endpoint."""
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

client = TestClient(app, follow_redirects=False)


def test_root_redirects_to_docs():
    response = client.get("/")
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"


def test_health():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

**Step 2: Run test — confirm failure**

```bash
cd backend
python -m pytest tests/test_root.py::test_root_redirects_to_docs -v
```

Expected: `FAILED` — 404 ≠ 307.

**Step 3: Add root redirect to `backend/main.py`**

After the `@app.get("/health")` block (after line 61), insert:

```python
from fastapi.responses import RedirectResponse

@app.get("/")
def root() -> RedirectResponse:
    """Redirect humans to interactive API docs."""
    return RedirectResponse(url="/docs")
```

Note: `RedirectResponse` import should be added to the existing `from fastapi.responses import PlainTextResponse` line:

```python
from fastapi.responses import PlainTextResponse, RedirectResponse
```

**Step 4: Delete Procfile**

```bash
rm backend/Procfile
```

**Step 5: Run tests — green**

```bash
cd backend
python -m pytest tests/ -v
```

Expected: all pass.

**Step 6: Verify root locally**

```bash
cd backend
uvicorn main:app --port 8001 &
curl -I http://localhost:8001/
# Location: /docs, HTTP/1.1 307
kill %1
```

**Step 7: Commit**

```bash
git add backend/main.py backend/tests/test_root.py
git rm backend/Procfile
git commit -m "fix: add root→/docs redirect, drop redundant Procfile"
git push
```

Railway auto-deploys on push (if linked). After ~2 min verify:
```
curl -I https://coupletime-production.up.railway.app/
# expect 307 → /docs
```

---

## Task 3 — Wire VITE_VIBEMIND_API_URL via GitHub Actions (C2)

**Files:**
- Create: `.github/workflows/deploy-gh-pages.yml`

**Why:** `npm run deploy` runs locally without the env var set → built bundle has `isVibeMindEnabled()` always returning false → upload pipeline never runs in production. Need a CI workflow that injects the secret at build time.

**Step 1: Add GitHub secret**

In GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
- Name: `VITE_VIBEMIND_API_URL`
- Value: `https://coupletime-production.up.railway.app`

(Do this in the browser — can't be automated here.)

**Step 2: Create `.github/workflows/deploy-gh-pages.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Build
        env:
          VITE_VIBEMIND_API_URL: ${{ secrets.VITE_VIBEMIND_API_URL }}
        run: npm run build

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: c-timer.machinetool.site
```

**Step 3: Verify build still passes locally with env var set**

```bash
VITE_VIBEMIND_API_URL=https://coupletime-production.up.railway.app npm run build 2>&1 | tail -5
```

Expected: build succeeds, no errors.

**Step 4: Commit**

```bash
git add .github/workflows/deploy-gh-pages.yml
git commit -m "ci: add GitHub Pages deploy workflow with VITE_VIBEMIND_API_URL"
git push
```

**Step 5: Verify**

In GitHub → Actions → "Deploy to GitHub Pages" → should be green. After deploy, open https://c-timer.machinetool.site → start a session with recording → finish → FinishedSessionView should show "Uploading to VibeMind…".

---

## Task 4 — Persistent storage via Railway volume (M4)

**Files:**
- Modify: `backend/session_store.py` (add startup warning)
- Modify: `backend/railway.toml` (document volume mount path)

**Why:** Railway's default filesystem is ephemeral — every redeploy wipes `/tmp`. Sessions and transcripts are lost. Fix: mount a Railway volume at `/data` and point `STORAGE_PATH` there.

**External step (Railway dashboard — must be done manually):**
1. Open Railway project → coupleTime backend service
2. Settings → Volumes → Add Volume
3. Mount path: `/data`
4. Size: 5 GB (enough for MVP)
5. Variables → Add `STORAGE_PATH=/data/vibemind-sessions`

**Step 1: Write test for ephemeral-storage warning**

Create `backend/tests/test_storage_warning.py`:

```python
"""Test that session_store warns when storage path looks ephemeral."""
import os
import logging
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_warns_when_tmp_storage(caplog, monkeypatch, tmp_path):
    monkeypatch.setenv("STORAGE_PATH", "/tmp/vibemind")
    import importlib
    import session_store
    importlib.reload(session_store)  # reload to pick up env change

    with caplog.at_level(logging.WARNING, logger="session_store"):
        session_store._storage_root()

    assert any("ephemeral" in r.message.lower() or "/tmp" in r.message for r in caplog.records)
```

**Step 2: Run test — confirm failure**

```bash
cd backend
python -m pytest tests/test_storage_warning.py -v
```

Expected: FAILED — no warning emitted yet.

**Step 3: Add warning to `backend/session_store.py`**

Add import at top of file:

```python
import logging
logger = logging.getLogger("session_store")
```

Modify `_storage_root()`:

```python
def _storage_root() -> Path:
    raw = os.environ.get("STORAGE_PATH", "/tmp/vibemind")
    if raw.startswith("/tmp"):
        logger.warning(
            "STORAGE_PATH=%s is ephemeral — sessions will be lost on redeploy. "
            "Set STORAGE_PATH to a Railway volume mount path (e.g. /data/vibemind-sessions).",
            raw,
        )
    p = Path(raw)
    p.mkdir(parents=True, exist_ok=True)
    return p
```

**Step 4: Update `backend/railway.toml` — document expected volume path**

Add comment so it's clear where the volume should be mounted:

```toml
[build]
builder = "NIXPACKS"

[deploy]
# Volume must be mounted at /data in Railway dashboard.
# Set env var: STORAGE_PATH=/data/vibemind-sessions
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Step 5: Run all backend tests — green**

```bash
cd backend
python -m pytest tests/ -v
```

Expected: all pass.

**Step 6: Commit**

```bash
git add backend/session_store.py backend/railway.toml backend/tests/test_storage_warning.py
git commit -m "fix: warn on ephemeral /tmp storage, document Railway volume mount"
git push
```

**Step 7: Code review**

After push, invoke: `/review-fix-cycle` or `superpowers:requesting-code-review` on `backend/` changes.

Review checklist:
- `_storage_root()` still creates dir even when ephemeral — correct (warn, don't block)
- Warning fires once per process start, not per request — confirm with log output
- Test reloads module to pick up env change — verify it doesn't pollute other tests

---

## Task 5 — Sprint H1 prep

After Task 4 passes code review and CI is green, the system is end-to-end testable. Sprint H1 scope:

**H1 — LLM semantic summary**

What's missing in `transcription.py`:
- `render_transcript_markdown` generates a shell with "Kurzüberblick" (word count only) — no real LLM call
- Sections missing: Hauptthemen, was A sagte / was B sagte, Gesprächsdynamik, Vereinbarungen, offene Fragen, nächste Schritte

Sprint H1 plan will need:
1. Add `OPENROUTER_API_KEY` / `OPENAI_API_KEY` env var routing for LLM calls
2. New `summarize_transcript()` function in `transcription.py` — calls LLM with structured prompt
3. Integrate summary into `render_transcript_markdown` output
4. Test with stub transcript (no real API needed in CI)
5. Frontend: show summary sections in `FinishedSessionView` or new `SessionSummaryView`

Create the Sprint H1 plan with `/writing-plans` once this sprint is merged and Railway volume is confirmed working.

---

## Execution order

```
Task 1 → commit → push → CI green
Task 2 → commit → push → Railway redeploys
Task 3 → add GitHub secret → commit → push → GH Actions deploys
Task 4 → external: Railway volume in dashboard → commit → push → code review → Sprint H1 prep
```
