const STORAGE_KEY = 'couplecare_session_count'

export function getCoupleCareSessionCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const n = raw === null ? 0 : Number.parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

export function incrementCoupleCareSessionCount(): number {
  const next = getCoupleCareSessionCount() + 1
  try {
    localStorage.setItem(STORAGE_KEY, String(next))
  } catch {
    /* storage unavailable - rotation falls back to theme 0 */
  }
  return next
}
