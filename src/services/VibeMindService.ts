/**
 * VibeMindService — thin HTTP client for the VibeMind backend.
 *
 * Base URL comes from VITE_VIBEMIND_API_URL. When the variable is absent or
 * empty all calls short-circuit: isVibeMindEnabled() returns false and callers
 * should skip the upload flow entirely.
 */

import type { PhaseMarker } from './AudioRecorderService'

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

const _base = (): string => (import.meta.env.VITE_VIBEMIND_API_URL ?? '').trim()

/** Returns true when a backend URL has been configured. */
export function isVibeMindEnabled(): boolean {
  return _base() !== ''
}

// ---------------------------------------------------------------------------
// Request / response types (mirror of backend models.py)
// ---------------------------------------------------------------------------

export interface SessionCreateMeta {
  participant_name_a: string
  participant_name_b: string
  mode_name: string
  mode_id: string
}

export interface SessionCreateResponse {
  session_id: string
  created_at: string
}

export interface UploadResponse {
  session_id: string
  status: 'uploaded'
}

export interface TranscribeResponse {
  session_id: string
  status: 'transcribing' | 'done'
  message: string
}

export type SessionStatus = 'pending' | 'uploaded' | 'transcribing' | 'done' | 'error'

export interface SessionDetailResponse {
  session_id: string
  status: SessionStatus
  created_at: string
  mode_name: string
  participant_name_a: string
  participant_name_b: string
  transcript: unknown | null
  error: string | null
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * POST /sessions — create a new session record.
 */
export async function createSession(meta: SessionCreateMeta): Promise<SessionCreateResponse> {
  const res = await fetch(`${_base()}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`createSession failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<SessionCreateResponse>
}

/**
 * POST /sessions/{id}/recording — upload audio blob + phase markers.
 */
export async function uploadRecording(
  sessionId: string,
  blob: Blob,
  phases: PhaseMarker[],
): Promise<UploadResponse> {
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  form.append('phases', JSON.stringify(phases))

  const res = await fetch(`${_base()}/sessions/${sessionId}/recording`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`uploadRecording failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<UploadResponse>
}

/**
 * POST /sessions/{id}/transcribe — kick off async transcription.
 */
export async function triggerTranscription(sessionId: string): Promise<TranscribeResponse> {
  const res = await fetch(`${_base()}/sessions/${sessionId}/transcribe`, {
    method: 'POST',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`triggerTranscription failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<TranscribeResponse>
}

/**
 * GET /sessions/{id} — fetch current session status and transcript.
 */
export async function getSession(sessionId: string): Promise<SessionDetailResponse> {
  const res = await fetch(`${_base()}/sessions/${sessionId}`)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`getSession failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<SessionDetailResponse>
}

/**
 * Construct the direct URL to a session's transcript markdown.
 * Returns null when VibeMind is not configured.
 */
export function getTranscriptMdUrl(sessionId: string): string | null {
  const base = _base()
  if (!base) return null
  return `${base}/sessions/${sessionId}/transcript.md`
}

/**
 * Construct the direct URL to a session's summary markdown.
 * Returns null when VibeMind is not configured.
 */
export function getSummaryMdUrl(sessionId: string): string | null {
  const base = _base()
  if (!base) return null
  return `${base}/sessions/${sessionId}/summary.md`
}
