# Sprint I — Gap Close: CI Green + Polling + Transcript Available

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close every blocking gap between the current VibeMind implementation and a fully end-to-end testable + production-ready pipeline: fix CI, add status polling so links activate dynamically, expose `transcript_available` field, and add recording consent.

**Architecture:** Three independent engineering tasks (one per area: tests, frontend polling, backend field) followed by two manual infra steps. Tasks are sequenced by blast radius — tests first (CI gate), then frontend changes, then backend model change, then infra. Each task ends with a commit + CI-verified push.

**Tech Stack:** TypeScript/Vitest/Testing Library (Task 1), React/useEffect/setInterval (Task 2), FastAPI/Pydantic v2 (Task 3).

---

## Context for implementer

**What exists:**
- FastAPI backend: sessions, upload, transcribe, transcript.md, summary.md endpoints — all tested, all green
- Frontend: AudioRecorderService, SessionContext upload flow, FinishedSessionView with transcript/summary links
- GitHub Actions workflow `.github/workflows/deploy-gh-pages.yml` — exists, injects `VITE_VIBEMIND_API_URL` from secret
- `conftest.py` in `backend/` handles sys.path — test files should NOT add sys.path manually

**What's broken/missing:**
- 2 tests in `SessionView.test.tsx` timeout at 5000ms (C1 — blocks CI)
- Frontend shows transcript/summary links immediately after upload but backend takes 1–2 min — links go 404 (H1)
- `SessionDetailResponse` has `summary_available` but no `transcript_available` — can't distinguish readiness per document (H2)
- Recording happens without an in-app consent confirmation (M2)

**Run backend tests:**
```bash
cd /path/to/coupleTime
uv run python -m pytest backend/tests/ -v
```
Never use `python -m pytest` without `uv run`.

**Run frontend tests:**
```bash
npm run test:run
```

---

## Task 1 — Fix SessionView test timeouts (C1)

**Files:**
- Modify: `src/components/__tests__/SessionView.test.tsx`

**Context:** Two tests timeout at 5000ms. Both call `startSessionWithMode()` which searches for a mode card by text content then waits for a Start Session button. The exact failure point is unknown from static analysis — could be: mode card not found, Start button accessible name mismatch, or async error in SessionEngine.start(). This task investigates first, then fixes.

---

**Step 1: Run failing tests with verbose output to see actual errors**

```bash
npm run test -- src/components/__tests__/SessionView.test.tsx --reporter=verbose 2>&1 | head -80
```

Expected: Two FAIL entries with full error messages. Note the exact error for each failing test.

---

**Step 2: Add debug output to understand DOM state at failure point**

Temporarily add to `startSessionWithMode` in the test file (lines 95–112), right after `const modeButtons = screen.getAllByRole('button')`:

```typescript
// DEBUG: log all button texts to identify matching issue
console.log('DEBUG buttons:', modeButtons.map(b => ({ text: b.textContent?.slice(0, 40), ariaLabel: b.getAttribute('aria-label') })))
```

Run the test again:
```bash
npm run test -- src/components/__tests__/SessionView.test.tsx --reporter=verbose 2>&1 | grep -A 5 'DEBUG\|FAIL\|Error'
```

Expected: See button texts. Determine if mode card is found or not.

---

**Step 3: Fix using data-testid (robust, i18n-independent)**

The reliable fix: add `data-testid` attributes to the mode card button and `StartButton`, then use `getByTestId` in tests instead of fragile text/role searches.

**In `src/components/ModeSelector.tsx`**, add `data-testid` to the inner button (line 166):
```tsx
<button
  onClick={onSelect}
  className="flex-1 text-left"
  data-testid={`mode-card-${mode.id}`}
>
```

**In `src/components/ControlButtons.tsx`**, add `data-testid` to `StartButton` (line 230):
```tsx
<motion.button
  ...
  data-testid="start-session-button"
>
```

**In `src/components/__tests__/SessionView.test.tsx`**, rewrite `startSessionWithMode` (lines 95–112):

```typescript
async function startSessionWithMode(modeFragment: string) {
  // Find mode card by data-testid — immune to i18n mock and aria-label changes
  const modeCard = screen.queryByTestId(`mode-card-${modeFragment}`)
  if (modeCard) {
    fireEvent.click(modeCard)
  }

  // Wait for Start Session button and click it
  const startButton = await waitFor(() =>
    screen.getByTestId('start-session-button'),
    { timeout: 3000 }
  )
  fireEvent.click(startButton)
}
```

Note: `modeFragment` must now be the exact mode ID (`'commitment'`, `'maintain'`, `'listening'`), which it already is in the tests.

---

**Step 4: Remove debug console.log**

Remove the DEBUG line added in Step 2.

---

**Step 5: Run tests — verify green**

```bash
npm run test:run 2>&1 | tail -10
```

Expected:
```
Test Files  0 failed | 45 passed (45)
Tests       0 failed | 519 passed
```

---

**Step 6: Commit**

```bash
git add src/components/__tests__/SessionView.test.tsx src/components/ModeSelector.tsx src/components/ControlButtons.tsx
git commit -m "fix: use data-testid for mode card and start button in SessionView tests"
git push
```

---

## Task 2 — Add status polling loop to SessionContext (H1)

**Files:**
- Modify: `src/contexts/SessionContext.tsx`
- Modify: `src/services/VibeMindService.ts` (update `SessionDetailResponse` type)
- Create: `src/contexts/__tests__/SessionContext.polling.test.ts`

**Context:** After `uploadStatus` reaches `'uploaded'`, the backend is still processing. The frontend never polls `GET /sessions/{id}` to know when `status === 'done'`. Links stay in "note: links available after 1-2 min" state indefinitely. Need: polling loop that transitions `uploadStatus` from `'uploaded'` → `'done'` (or `'error'`) when the backend is ready.

---

**Step 1: Update `SessionDetailResponse` type in `src/services/VibeMindService.ts`**

Current `SessionDetailResponse` interface (around line 51) lacks `transcript_available`. Add it:

```typescript
export interface SessionDetailResponse {
  session_id: string
  status: 'pending' | 'uploaded' | 'transcribing' | 'done' | 'error'
  created_at: string
  mode_name: string
  participant_name_a: string
  participant_name_b: string
  transcript: unknown | null
  transcript_available: boolean   // ADD THIS
  summary_available: boolean
  error: string | null
}
```

---

**Step 2: Add `pollSessionStatus` helper to `src/services/VibeMindService.ts`**

Add after the `getSession` function:

```typescript
/**
 * Poll session status until done/error or max attempts reached.
 * Calls onUpdate with the latest response on each poll.
 * Returns a cancel function.
 */
export function startStatusPolling(
  sessionId: string,
  onUpdate: (response: SessionDetailResponse) => void,
  intervalMs = 5000,
  maxAttempts = 36,  // 36 × 5s = 3 min max
): () => void {
  let attempts = 0
  let cancelled = false

  const tick = async () => {
    if (cancelled) return
    try {
      const data = await getSession(sessionId)
      if (cancelled) return
      onUpdate(data)
      attempts++
      if (data.status === 'done' || data.status === 'error' || attempts >= maxAttempts) {
        return
      }
      setTimeout(tick, intervalMs)
    } catch {
      // Network error — keep polling unless cancelled
      if (!cancelled) setTimeout(tick, intervalMs)
    }
  }

  setTimeout(tick, intervalMs)
  return () => { cancelled = true }
}
```

---

**Step 3: Add polling to `SessionContext.tsx`**

Add to imports at top of `src/contexts/SessionContext.tsx`:
```typescript
import {
  isVibeMindEnabled,
  createSession as vibemindCreateSession,
  uploadRecording as vibemindUpload,
  triggerTranscription as vibemindTranscribe,
  startStatusPolling,              // ADD THIS
} from '../services/VibeMindService'
```

Add to `SessionContextValue` interface (after `lastSessionId: string | null`):
```typescript
transcriptReady: boolean
summaryReady: boolean
```

Add state variables after `const [lastSessionId, ...]` declaration (~line 98):
```typescript
const [transcriptReady, setTranscriptReady] = useState(false)
const [summaryReady, setSummaryReady] = useState(false)
const pollingCancelRef = useRef<(() => void) | null>(null)
```

In the recording stop + upload block, after `setUploadStatus('uploaded')` (~line 184):

```typescript
setUploadStatus('uploaded')
// Start polling to detect when transcript/summary are ready
const cancel = startStatusPolling(session_id, (data) => {
  if (data.transcript_available) setTranscriptReady(true)
  if (data.summary_available) setSummaryReady(true)
  if (data.status === 'done' || data.status === 'error') {
    setUploadStatus(data.status === 'done' ? 'uploaded' : 'error')
  }
})
pollingCancelRef.current = cancel
```

In the `start` callback, reset polling state on new session start (after line ~`setUploadStatus('idle')`):
```typescript
setUploadStatus('idle')
setLastSessionId(null)
setTranscriptReady(false)
setSummaryReady(false)
if (pollingCancelRef.current) {
  pollingCancelRef.current()
  pollingCancelRef.current = null
}
```

Add `transcriptReady` and `summaryReady` to the context `value` object.

---

**Step 4: Update `FinishedSessionView` in `src/components/SessionView.tsx`**

Destructure new values from `useSession()`:
```typescript
const { stop, uploadStatus, lastSessionId, transcriptReady, summaryReady } = useSession()
```

Update the transcript/summary link section to show links only when ready:

```tsx
{lastSessionId && (
  <div className="flex flex-col gap-2 pt-2">
    {!transcriptReady && !summaryReady && (
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center animate-pulse">
        {t('session.finished.transcriptNote', 'Processing… links become available in ~1–2 min')}
      </p>
    )}
    <div className="flex gap-2 justify-center">
      {transcriptReady ? (
        <a
          href={getTranscriptMdUrl(lastSessionId) ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {t('session.finished.viewTranscript', 'View transcript')}
        </a>
      ) : (
        <span className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50">
          {t('session.finished.viewTranscript', 'View transcript')}
        </span>
      )}
      {summaryReady ? (
        <a
          href={getSummaryMdUrl(lastSessionId) ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          {t('session.finished.viewSummary', 'View summary')}
        </a>
      ) : (
        <span className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-400 dark:text-blue-600 cursor-not-allowed opacity-50">
          {t('session.finished.viewSummary', 'View summary')}
        </span>
      )}
    </div>
  </div>
)}
```

---

**Step 5: Write test for polling**

Create `src/contexts/__tests__/SessionContext.polling.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startStatusPolling } from '../../services/VibeMindService'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

vi.stubEnv('VITE_VIBEMIND_API_URL', 'https://api.example.com')

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllTimers()
})

describe('startStatusPolling', () => {
  it('calls onUpdate when session status is done', async () => {
    vi.useFakeTimers()
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: 'abc',
        status: 'done',
        transcript_available: true,
        summary_available: true,
        created_at: new Date().toISOString(),
        mode_name: 'Listening',
        participant_name_a: 'A',
        participant_name_b: 'B',
        transcript: null,
        error: null,
      }),
    })
    
    const onUpdate = vi.fn()
    startStatusPolling('abc', onUpdate, 5000, 5)
    
    await vi.advanceTimersByTimeAsync(5100)
    
    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onUpdate.mock.calls[0][0].status).toBe('done')
    expect(onUpdate.mock.calls[0][0].transcript_available).toBe(true)
    
    vi.useRealTimers()
  })

  it('cancel stops further polling', async () => {
    vi.useFakeTimers()
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: 'abc',
        status: 'transcribing',
        transcript_available: false,
        summary_available: false,
        created_at: new Date().toISOString(),
        mode_name: 'Listening',
        participant_name_a: 'A',
        participant_name_b: 'B',
        transcript: null,
        error: null,
      }),
    })
    
    const onUpdate = vi.fn()
    const cancel = startStatusPolling('abc', onUpdate, 5000, 10)
    
    await vi.advanceTimersByTimeAsync(5100)
    expect(onUpdate).toHaveBeenCalledOnce()
    
    cancel()
    await vi.advanceTimersByTimeAsync(10100)
    // Still only called once after cancel
    expect(onUpdate).toHaveBeenCalledOnce()
    
    vi.useRealTimers()
  })
})
```

---

**Step 6: Run tests — verify green**

```bash
npm run test:run 2>&1 | tail -10
```

Expected: 0 failed, all pass including new polling tests.

---

**Step 7: Commit**

```bash
git add src/services/VibeMindService.ts src/contexts/SessionContext.tsx src/components/SessionView.tsx src/contexts/__tests__/SessionContext.polling.test.ts
git commit -m "feat: poll session status so transcript/summary links activate when processing completes"
git push
```

---

## Task 3 — Add `transcript_available` to backend response (H2)

**Files:**
- Modify: `backend/models.py`
- Modify: `backend/main.py`
- Modify: `backend/tests/test_summary_endpoint.py`

**Context:** `SessionDetailResponse` has `summary_available` but not `transcript_available`. The frontend can't independently know when the transcript (without summary) is ready vs when both are ready.

---

**Step 1: Write failing test**

Add to `backend/tests/test_summary_endpoint.py`, after existing tests:

```python
def test_session_detail_has_transcript_available_false():
    """transcript_available defaults to false when no transcript exists."""
    client = TestClient(app)
    # Create a session
    meta = session_store.create_session("A", "B", "Listening", "listening")
    
    response = client.get(f"/sessions/{meta.session_id}")
    assert response.status_code == 200
    data = response.json()
    assert "transcript_available" in data
    assert data["transcript_available"] is False
```

**Step 2: Run failing test**

```bash
uv run python -m pytest backend/tests/test_summary_endpoint.py::test_session_detail_has_transcript_available_false -v
```

Expected: FAIL — `transcript_available` not in response.

---

**Step 3: Add field to `backend/models.py`**

After line 112 (`summary_available: bool = False`), add:

```python
transcript_available: bool = False
```

Final `SessionDetailResponse` block:
```python
class SessionDetailResponse(BaseModel):
    session_id: str
    status: SessionStatus
    created_at: datetime
    mode_name: str
    participant_name_a: str
    participant_name_b: str
    transcript: TranscriptResult | None = None
    transcript_available: bool = False
    summary_available: bool = False
    error: str | None = None
```

---

**Step 4: Populate field in `backend/main.py`**

In `get_session()` (around line 131), update:

```python
def get_session(session_id: str) -> SessionDetailResponse:
    """Return session metadata and transcript (if available)."""
    meta = _get_or_404(session_id)
    transcript = session_store.load_transcript(session_id)
    transcript_available = session_store.load_transcript_md(session_id) is not None
    summary_available = session_store.load_summary_md(session_id) is not None
    return SessionDetailResponse(
        session_id=meta.session_id,
        status=meta.status,
        created_at=meta.created_at,
        mode_name=meta.mode_name,
        participant_name_a=meta.participant_name_a,
        participant_name_b=meta.participant_name_b,
        transcript=transcript,
        transcript_available=transcript_available,
        summary_available=summary_available,
        error=meta.error,
    )
```

---

**Step 5: Run all backend tests — green**

```bash
uv run python -m pytest backend/tests/ -v
```

Expected: 14 passed (was 13 — one new test added).

---

**Step 6: Commit**

```bash
git add backend/models.py backend/main.py backend/tests/test_summary_endpoint.py
git commit -m "feat: add transcript_available field to SessionDetailResponse"
git push
```

---

## Task 4 — Recording consent notice (M2)

**Files:**
- Modify: `src/components/SessionView.tsx` (add consent banner to `ActiveSessionView`)

**Context:** The recording toggle silently starts capturing audio when enabled + session starts. Under GDPR/privacy law, recording personal conversation audio requires clear user notice. A non-blocking banner in `ActiveSessionView` is sufficient (user already opted in with the toggle, but should see visual confirmation).

---

**Step 1: Add i18n keys**

In `src/i18n/locales/en/translation.json`, add to `session` section:
```json
"recording": {
  "notice": "Session audio is being recorded",
  "enableLabel": "Enable recording"
}
```

In `src/i18n/locales/de/translation.json`:
```json
"recording": {
  "notice": "Sitzungsaudio wird aufgezeichnet",
  "enableLabel": "Aufnahme aktivieren"
}
```

---

**Step 2: Add consent banner to `ActiveSessionView` in `src/components/SessionView.tsx`**

In `ActiveSessionView`, after the `<RecBadge>` span and before `</header>`, add:

```tsx
{/* Recording notice — shown while actively recording */}
{isRecording && (
  <div className="mt-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
    <svg className="w-3 h-3 flex-shrink-0 fill-current" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="4" />
    </svg>
    {t('session.recording.notice', 'Session audio is being recorded')}
  </div>
)}
```

---

**Step 3: Run frontend tests — green**

```bash
npm run test:run 2>&1 | tail -10
```

Expected: 0 failed.

---

**Step 4: Commit**

```bash
git add src/components/SessionView.tsx src/i18n/locales/en/translation.json src/i18n/locales/de/translation.json
git commit -m "feat: show recording notice banner in active session when audio is captured"
git push
```

---

## Manual Infrastructure Steps (not code — do in dashboards)

**After all 4 tasks are committed and CI is green:**

### Infra A — GitHub: Set VITE_VIBEMIND_API_URL secret

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
- Name: `VITE_VIBEMIND_API_URL`
- Value: `https://coupletime-production.up.railway.app`

Then trigger a re-deploy: push a commit or trigger `Deploy to GitHub Pages` workflow manually.

**Verify:** Open https://c-timer.machinetool.site → start a session → stop → check that "Uploading to VibeMind…" spinner appears (proves `isVibeMindEnabled()` returns true).

### Infra B — Railway: Volume + STORAGE_PATH

Railway dashboard → coupleTime project → backend service:
1. Settings → Volumes → Add Volume → Mount path: `/data` → Size: 5 GB
2. Variables → Add `STORAGE_PATH=/data/vibemind-sessions`
3. Redeploy

**Verify:** Upload a session, redeploy the service, check that session still exists via `GET /sessions/{id}`.

### Infra C — Railway: LLM key

Railway dashboard → backend service → Variables:
- Add `OPENAI_API_KEY=sk-...` OR `OPENROUTER_API_KEY=sk-or-...`
- Optional: `LLM_MODEL=gpt-4o-mini` (default if omitted)

**Verify:** Run a full session → after ~2 min → check summary.md returns a real structured summary (not stub placeholder text).

---

## Execution order

```
Task 1 → Task 2 → Task 3 → Task 4 → Infra A → Infra B → Infra C
         (can be parallel if CI is trusted green after Task 1)
```

**End state:** CI green, production frontend shows upload flow, transcript/summary links activate dynamically when backend finishes, recording is clearly announced.
