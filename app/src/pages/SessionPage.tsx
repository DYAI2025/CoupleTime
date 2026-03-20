import { useEffect, useRef, useCallback } from 'react'
import { useSession } from '@/viewModel/SessionContext'
import { useTranslation } from '@/hooks/useTranslation'
import { SessionCompletedView } from '@/components/SessionCompletedView'
import { Square, Pause, Play, Maximize2, Minimize2 } from 'lucide-react'
import { useState } from 'react'

// ── Phase-Farben ──────────────────────────────────────────────────────────────
const PHASE_BG: Record<string, string> = {
  prep:       'from-slate-50  to-slate-100',
  slotA:      'from-blue-50   to-blue-100',
  slotB:      'from-rose-50   to-rose-100',
  transition: 'from-amber-50  to-amber-100',
  closingA:   'from-blue-50   to-blue-100',
  closingB:   'from-rose-50   to-rose-100',
  cooldown:   'from-emerald-50 to-emerald-100',
}
const PHASE_ACCENT: Record<string, string> = {
  prep:       'text-slate-600',
  slotA:      'text-blue-700',
  slotB:      'text-rose-700',
  transition: 'text-amber-700',
  closingA:   'text-blue-700',
  closingB:   'text-rose-700',
  cooldown:   'text-emerald-700',
}
const PHASE_RING: Record<string, string> = {
  prep:       '#64748b',
  slotA:      '#2563eb',
  slotB:      '#e11d48',
  transition: '#d97706',
  closingA:   '#2563eb',
  closingB:   '#e11d48',
  cooldown:   '#059669',
}
const PHASE_BADGE_BG: Record<string, string> = {
  prep:       'bg-slate-100  text-slate-700',
  slotA:      'bg-blue-100   text-blue-800',
  slotB:      'bg-rose-100   text-rose-800',
  transition: 'bg-amber-100  text-amber-800',
  closingA:   'bg-blue-100   text-blue-800',
  closingB:   'bg-rose-100   text-rose-800',
  cooldown:   'bg-emerald-100 text-emerald-800',
}
// Phase labels resolved via t() at render time — see getPhaseLabel()
const PHASE_LABEL_KEYS: Record<string, string> = {
  prep:       'phaseLabels.prep',
  slotA:      'phaseLabels.speaks',
  slotB:      'phaseLabels.speaks',
  transition: 'phaseLabels.transition',
  closingA:   'phaseLabels.closing',
  closingB:   'phaseLabels.closing',
  cooldown:   'phaseLabels.cooldown',
}

// ── SVG Ring Timer ────────────────────────────────────────────────────────────
function RingTimer({ progress, time, color, isPaused }: {
  progress: number; time: string; color: string; isPaused: boolean
}) {
  const size = 260; const sw = 10; const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute rounded-full opacity-20 blur-xl"
        style={{ width: size + 40, height: size + 40, backgroundColor: color }} />
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition:'stroke-dashoffset 0.4s ease-out', filter:'drop-shadow(0 0 6px rgba(0,0,0,0.15))' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono tabular-nums leading-none"
          style={{ fontSize:64, fontWeight:300, color: isPaused ? '#94a3b8' : '#1e293b', transition:'color 0.3s' }}>
          {time}
        </span>
        {isPaused && (
          <span className="mt-1 text-xs font-semibold tracking-widest uppercase text-slate-400 animate-pulse">
            {isPaused ? 'PAUSE' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Phase-Strip ───────────────────────────────────────────────────────────────
function PhaseStrip({ phases, currentIndex, progress }: {
  phases: Array<{ type: string }>; currentIndex: number; progress: number
}) {
  if (phases.length === 0) return null
  return (
    <div className="w-full max-w-sm">
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
        {phases.map((p, i) => {
          const done = i < currentIndex; const curr = i === currentIndex
          const w = done ? 100 : curr ? progress * 100 : 0
          return (
            <div key={i} className="flex-1 overflow-hidden" style={{ background:'#e2e8f0' }}>
              <div style={{ width:`${w}%`, height:'100%',
                background: PHASE_RING[p.type] || '#94a3b8',
                transition:'width 0.4s ease-out' }} />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
        <span>Phase {currentIndex + 1}/{phases.length}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  )
}

// ── Restore Banner ────────────────────────────────────────────────────────────
function RestoreBanner({ onRestore, onDiscard, t }: { onRestore: () => void; onDiscard: () => void; t: (key: string) => string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm shadow-2xl text-center">
        <div className="text-3xl mb-3">⏸</div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">{t("sessionPage.resumePrompt")}</h2>
        <p className="text-sm text-slate-500 mb-5">
          {t("sessionPage.resumeDesc")}
        </p>
        <div className="flex gap-3">
          <button onClick={onDiscard}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            {t("sessionPage.discard")}
          </button>
          <button onClick={onRestore}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700">
            {t("sessionPage.resume")}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────
export default function SessionPage() {
  const {
    status, isPaused, isFinished, selectedMode,
    currentPhase, currentPhaseIndex, totalPhases,
    remainingTimeFormatted, progressFraction, sessionProgressFraction,
    speaker, speakerName, phaseInstruction, phaseSubtitle, phaseFocusText,
    nextPhase, start, pause, resume, stop,
    hasSavedSession, restoreSavedSession, discardSavedSession,
    nameA, nameB,
  } = useSession()
  const { t } = useTranslation()

  const wrapRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Auto-start if a mode was selected
  useEffect(() => {
    if (selectedMode && status === 'idle' && !hasSavedSession) {
      start(selectedMode)
    } else if (!selectedMode && status === 'idle' && !hasSavedSession) {
      window.location.href = '/#/'
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track fullscreen changes
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      el.requestFullscreen?.().catch(() => {})
    }
  }, [])

  const handleStop = () => { stop(); window.location.href = '/#/' }
  const handlePauseResume = () => isPaused ? resume() : pause()

  if (isFinished) return <SessionCompletedView onDone={() => { stop(); window.location.href = '/#/' }} />

  const phType = currentPhase?.type ?? 'prep'
  const color = PHASE_RING[phType] ?? '#64748b'
  const bgGrad = PHASE_BG[phType] ?? 'from-slate-50 to-slate-100'
  const accentCls = PHASE_ACCENT[phType] ?? 'text-slate-700'
  const badgeCls = PHASE_BADGE_BG[phType] ?? 'bg-slate-100 text-slate-600'
  const phases = selectedMode?.phases ?? []

  // Phase-Badge label with real names
  const phaseBadgeLabel = (() => {
    const key = PHASE_LABEL_KEYS[phType]
    const base = key ? t(key) : phType
    if (phType === 'slotA' || phType === 'closingA') return `${nameA} ${base}`
    if (phType === 'slotB' || phType === 'closingB') return `${nameB} ${base}`
    return base
  })()

  // What to show as the main instruction (custom focusText beats auto-instruction)
  const mainInstruction = phaseFocusText || phaseInstruction
  const subtitle = phaseSubtitle

  return (
    <>
      {hasSavedSession && (
        <RestoreBanner onRestore={restoreSavedSession} onDiscard={discardSavedSession} t={t} />
      )}

      <main
        ref={wrapRef}
        className={`min-h-screen flex flex-col bg-gradient-to-b ${bgGrad}`}
        style={{ transition: 'background 0.7s ease' }}
      >
        {/* ── TOP BAR ── */}
        <header className="flex items-center justify-between px-5 py-4">
          <div className="text-sm font-medium text-slate-500 truncate max-w-[140px]">
            {selectedMode?.name ?? 'Session'}
          </div>
          <div className="flex-1 mx-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-slate-400 transition-all duration-500"
              style={{ width: `${Math.round(sessionProgressFraction * 100)}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {Math.round(sessionProgressFraction * 100)}%
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50"
              aria-label={isFullscreen ? t('sessionPage.fullscreenExit') : t('sessionPage.fullscreen')}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* ── PHASE BADGE ── */}
        <div className="flex justify-center pt-2 pb-1">
          <div className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide ${badgeCls}`}
            style={{ transition: 'all 0.4s' }}>
            {phaseBadgeLabel} · Phase {currentPhaseIndex + 1}/{totalPhases}
          </div>
        </div>

        {/* ── HAUPTINHALT ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">

          {/* MAIN INSTRUCTION */}
          <div className="text-center space-y-2 max-w-sm">
            <h2 className={`font-bold leading-tight ${accentCls}`}
              style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', transition: 'color 0.4s' }}>
              {mainInstruction}
            </h2>
            {subtitle && (
              <p className="text-slate-500 text-sm leading-relaxed">{subtitle}</p>
            )}
          </div>

          {/* SPEAKER BADGE */}
          {speaker && (
            <div className="px-6 py-2.5 rounded-full text-base font-bold tracking-wide shadow-sm"
              style={{
                backgroundColor: speaker === 'A' ? 'rgba(37,99,235,0.12)' : 'rgba(225,29,72,0.12)',
                color: speaker === 'A' ? '#1d4ed8' : '#be123c',
                transition: 'all 0.4s',
              }}>
              🎙 {speakerName}
            </div>
          )}

          {/* RING TIMER */}
          <div className={isPaused ? 'opacity-60' : 'opacity-100'} style={{ transition: 'opacity 0.5s' }}>
            <RingTimer
              progress={progressFraction}
              time={remainingTimeFormatted}
              color={color}
              isPaused={isPaused}
            />
          </div>

          {/* PHASE STRIP */}
          <PhaseStrip phases={phases} currentIndex={currentPhaseIndex} progress={progressFraction} />

          {/* NEXT PHASE PREVIEW */}
          {nextPhase && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{t('sessionPage.nextUp')}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${PHASE_BADGE_BG[nextPhase.type] ?? 'bg-slate-100'}`}>
                {PHASE_LABEL_KEYS[nextPhase.type] ? t(PHASE_LABEL_KEYS[nextPhase.type]) : nextPhase.type}
              </span>
              <span>{Math.round(nextPhase.duration / 60)} min</span>
            </div>
          )}
        </div>

        {/* ── CONTROLS ── */}
        <footer className="flex items-center justify-center gap-5 pb-12 pt-6">
          <button onClick={handleStop}
            className="w-14 h-14 rounded-full border-2 border-slate-300 bg-white/80 text-slate-500
              hover:border-red-400 hover:text-red-500 hover:bg-red-50
              flex items-center justify-center shadow-sm transition-all"
            aria-label={t('sessionPage.stopSession')}>
            <Square className="w-5 h-5 fill-current" />
          </button>

          <button onClick={handlePauseResume}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all
              ${isPaused
                ? 'bg-sky-500 hover:bg-sky-600 text-white border-2 border-sky-500'
                : 'border-2 border-slate-300 bg-white/80 text-slate-500 hover:border-sky-400 hover:text-sky-600'
              }`}
            aria-label={isPaused ? t('sessionPage.resume') : t('session.controls.pause')}>
            {isPaused ? <Play className="w-6 h-6 ml-0.5" /> : <Pause className="w-6 h-6" />}
          </button>
        </footer>

        {/* PAUSE OVERLAY */}
        {isPaused && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px]" />
          </div>
        )}
      </main>
    </>
  )
}
