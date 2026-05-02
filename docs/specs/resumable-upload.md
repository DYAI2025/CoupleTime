# Resumable Audio Upload Spec — VibeMind

Resolves [C2] from the design code-review.

## Why

A single PUT of a 50 MB OPUS file over typical home WiFi fails ~5% of the time mid-transfer (router hiccup, ISP blip, sleep mode). For a single-user MVP that's acceptable on retry; for an investor demo a single failed upload ruins the moment. We need chunked-upload-with-retry as a baseline, and the architecture should also support full resume-after-page-reload as a stretch goal without protocol change.

This is **not full tus.io** — that protocol carries OPTIONS-handshake, multiple endpoints, and metadata negotiation we don't need. We implement the minimum viable chunked-upload pattern.

## Protocol

### Frontend (CoupleTimer)

After `MediaRecorder.stop()` resolves and the audio Blob is finalized:

1. **Register the session.** Issue:
   ```
   POST /api/sessions
   Content-Type: application/json
   X-API-Key: $VITE_VIBEMIND_API_KEY

   {
     "client_session_id": "<uuid generated client-side>",
     "started_at_ms": 1714600800000,
     "ended_at_ms":   1714604400000,
     "phase_timeline": [...],
     "participant_config": { "nameA": "...", "nameB": "..." },
     "mode_id": "maintain",
     "audio_total_bytes": 51234567,
     "audio_sha256": "<hex of full blob>",
     "audio_chunk_size": 1048576
   }
   ```
   Backend responds:
   ```json
   { "session_id": "...", "upload_id": "...", "expected_chunks": 49 }
   ```

2. **Upload each chunk in order.** Split the Blob into 1 MiB slices client-side. For chunk `i` (0-indexed):
   ```
   PUT /api/sessions/{session_id}/audio
   X-API-Key: $VITE_VIBEMIND_API_KEY
   X-Upload-Id: <upload_id>
   X-Chunk-Index: <i>
   Content-Range: bytes <start>-<end>/<total>
   Content-Type: application/octet-stream
   Body: <chunk-bytes>
   ```
   Wait for `200 OK` before sending chunk `i+1`. Sequential, not parallel — keeps backend logic simple, and 1 MiB chunks at typical home upload (~5-50 Mbps) are 0.2-2 seconds each, fast enough.

3. **Retry on failure.** On `4xx` (except `409 Conflict`) or `5xx` or fetch-rejection:
   ```
   delays = [1, 2, 4, 8]  // seconds
   for attempt in delays:
     await sleep(attempt * 1000)
     retry the same chunk
   if still failing:
     surface "Upload fehlgeschlagen — bitte WLAN prüfen und erneut versuchen" to user
     pause uploads, persist progress to LocalStorage
   ```

4. **`409 Conflict` is special.** Means the chunk was already received (e.g. retry after backend ACKed but network dropped before client saw the response). Skip to the next chunk.

5. **Finalize.** After last chunk acked:
   ```
   POST /api/sessions/{session_id}/audio/finalize
   X-API-Key: ...
   X-Upload-Id: ...

   { "expected_sha256": "<hex>" }
   ```
   Backend verifies SHA, renames `.partial` → `.opus`, enqueues the transcription job. Returns `200 OK` with the job-tracking URL.

### Backend (FastAPI)

#### `POST /api/sessions`

```python
@app.post("/api/sessions")
async def create_session(req: SessionCreateRequest, db: Session = Depends(get_db)):
    session = Session(
        id=str(uuid7()),
        client_session_id=req.client_session_id,
        started_at_ms=req.started_at_ms,
        ended_at_ms=req.ended_at_ms,
        phase_timeline_json=req.phase_timeline,
        participant_config_json=req.participant_config,
        mode_id=req.mode_id,
        audio_total_bytes=req.audio_total_bytes,
        audio_sha256=req.audio_sha256,
        audio_chunk_size=req.audio_chunk_size,
    )
    upload_id = str(uuid7())
    upload = Upload(
        id=upload_id,
        session_id=session.id,
        bytes_received=0,
        next_expected_chunk=0,
    )
    db.add(session)
    db.add(upload)
    db.commit()

    expected_chunks = ceil(req.audio_total_bytes / req.audio_chunk_size)
    return {"session_id": session.id, "upload_id": upload_id, "expected_chunks": expected_chunks}
```

#### `PUT /api/sessions/{id}/audio`

```python
@app.put("/api/sessions/{session_id}/audio")
async def upload_chunk(
    session_id: str,
    request: Request,
    x_upload_id: str = Header(),
    x_chunk_index: int = Header(),
    content_range: str = Header(),
    db: Session = Depends(get_db),
):
    upload = db.get(Upload, x_upload_id)
    if upload.session_id != session_id:
        raise HTTPException(403)

    # Idempotency: chunk already received?
    if x_chunk_index < upload.next_expected_chunk:
        return Response(status_code=409, content="chunk already received")

    # Strict ordering: only accept the chunk we expect next.
    if x_chunk_index != upload.next_expected_chunk:
        raise HTTPException(400, f"out-of-order: expected {upload.next_expected_chunk}, got {x_chunk_index}")

    # Validate Content-Range matches expected byte offset
    start, end, total = parse_content_range(content_range)
    expected_start = upload.bytes_received
    if start != expected_start:
        raise HTTPException(400, "Content-Range start mismatch")

    chunk = await request.body()
    partial_path = f"/var/vibemind/uploads/{x_upload_id}.partial"
    async with aiofiles.open(partial_path, "ab") as f:
        await f.write(chunk)

    upload.bytes_received += len(chunk)
    upload.next_expected_chunk += 1
    db.commit()

    return {"received_bytes": upload.bytes_received}
```

#### `POST /api/sessions/{id}/audio/finalize`

```python
@app.post("/api/sessions/{session_id}/audio/finalize")
async def finalize(session_id: str, req: FinalizeRequest, db: Session = Depends(get_db)):
    session = db.get(Session, session_id)
    upload = db.query(Upload).filter_by(session_id=session_id).first()

    if upload.bytes_received != session.audio_total_bytes:
        raise HTTPException(400, "incomplete: expected {expected}, got {got}".format(...))

    partial = f"/var/vibemind/uploads/{upload.id}.partial"
    actual_sha = await sha256_file(partial)
    if actual_sha != session.audio_sha256:
        os.remove(partial)
        raise HTTPException(400, "sha256 mismatch")

    final_path = f"/var/vibemind/audio/{session_id}.opus"
    os.rename(partial, final_path)

    job = enqueue_job(stage="transcription_diarization", session_id=session_id, payload={"audio_path": final_path})
    return {"job_id": job.id, "status_url": f"/api/sessions/{session_id}/status"}
```

## Resume after page reload (stretch — protocol-ready, MVP code optional)

The IndexedDB-backed audio Blob persists across reloads (see `MediaRecorder` design in the broader plan). If the frontend additionally persists `{session_id, upload_id, last_acked_chunk_index}` to LocalStorage on every successful chunk ACK, then on app startup we can:

1. Detect un-finalized session in LocalStorage.
2. Show a banner: *"Letzte Session wurde unterbrochen — Upload fortsetzen?"*
3. On confirm: read the audio Blob from IndexedDB, slice from `last_acked_chunk_index + 1`, resume.

The protocol above already supports this — `409 Conflict` handles the rare race where the server ACKed a chunk but the client crashed before persisting the ACK. **Not built in MVP but no protocol change needed later.**

## What this is not

- **Not full tus.io.** No protocol negotiation, no separate metadata endpoint, no extension negotiation. If we ever need cross-client interop, we migrate to tus then.
- **Not WebSocket / streaming.** HTTP/2 multiplexing handles 1 MiB chunks fine on modern browsers. WebSocket adds connection-state complexity for no MVP gain.
- **Not parallel chunk upload.** Sequential keeps the server logic to a single counter (`next_expected_chunk`), avoids out-of-order assembly bugs. Modern WiFi saturates at 1 chunk in flight anyway.

## Storage layout

```
/var/vibemind/
├── uploads/                    # in-progress
│   └── {upload_id}.partial
└── audio/                      # finalized
    └── {session_id}.opus
```

Cleanup: a daily cron deletes `*.partial` files older than 7 days whose corresponding `Upload` row has `next_expected_chunk < expected_chunks` (definitely abandoned).

## Test plan

| Layer | Test |
|---|---|
| Unit | `parse_content_range("bytes 0-1048575/51234567")` → `(0, 1048575, 51234567)` |
| Unit | out-of-order chunk → `400` |
| Unit | duplicate chunk → `409` |
| Unit | mismatched `Content-Range` start → `400` |
| Integration | upload 5 sequential chunks, verify file content matches |
| Integration | inject network failure on chunk 3, verify retry succeeds and final file is correct |
| Integration | upload all chunks but corrupt one byte before finalize, verify SHA mismatch fails finalize and removes `.partial` |
| Manual | DevTools throttle to "Slow 3G", upload a 50 MB file, verify it completes |
| Manual | mid-upload, kill the connection (airplane mode), reconnect, verify resume picks up correctly |

## Why 1 MiB chunk size

| Chunk size | Pros | Cons |
|---|---|---|
| 256 KiB | survives flakier connections | 200 round-trips for 50 MB → noticeable overhead from sequential handshakes |
| **1 MiB** | balanced — ~50 round-trips for 50 MB, < 2 sec each on home upload | small enough to retry cheaply on failure |
| 4 MiB | fewer round-trips | each retry costs more bandwidth on flaky connections |
| 16 MiB | basically single-shot for our file size | lose the resilience benefit |

1 MiB is the standard "big enough to amortize HTTP overhead, small enough to retry cheaply" sweet spot.
