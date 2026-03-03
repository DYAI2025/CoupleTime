import { useEffect } from 'react'
import { useSession } from '@/viewModel/SessionContext'
import { SessionCompletedView } from '@/components/SessionCompletedView'
import { Square, Pause, Play } from 'lucide-react'

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

// ── Circular SVG ring timer ───────────────────────────────────────────────────

function RingTimer({
  progress, time, color, isPaused,
}: { progress: number; time: string; color: string; isPaused: boolean }) {
  const size = 260
  const sw = 10
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow */}
      <div
        className="absolute rounded-full opacity-20 blur-xl"
        style={{ width: size + 40, height: size + 40, backgroundColor: color }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease-out', filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.15))' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="font-mono tabular-nums leading-none"
          style={{
            fontSize: 64,
            fontWeight: 300,
            color: isPaused ? '#94a3b8' : '#1e293b',
            transition: 'color 0.3s',
          }}
        >
          {time}
        </span>
        {isPaused && (
          <span className="mt-1 text-xs font-semibold tracking-widest uppercase text-slate-400 animate-pulse">
            Pause
          </span>
        )}
      </div>
    </div>
  )
}

// ── Phase-Fortschritts-Leiste (alle Phasen als Segmente) ─────────────────────

function PhaseStrip({
  phases, currentIndex, progress,
}: {
  phases: Array<{ type: string }>
  currentIndex: number
  progress: number
}) {
  if (phases.length === 0) return null
  return (
    <div className="w-full max-w-sm">
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-slate-200">
        {phases.map((p, i) => {
          const done = i < currentIndex
          const curr = i === currentIndex
          const w = done ? 100 : curr ? progress * 100 : 0
          const col = PHASE_RING[p.type] || '#94a3b8'
          return (
            <div key={i} className="flex-1 overflow-hidden" style={{ background: '#e2e8f0' }}>
              <div
                style={{
                  width: `${w}%`, height: '100%',
                  background: col,
                  transition: 'width 0.4s ease-out',
                }}
              />
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

// ── "Nächste Phase" Preview ───────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  prep:       'Vorbereitung',
  slotA:      'Partner A spricht',
  slotB:      'Partner B spricht',
  transition: 'Übergang',
  closingA:   'Abschluss A',
  closingB:   'Abschluss B',
  cooldown:   'Ausklang',
}

function NextPhaseHint({ type, duration }: { type: string; duration: number }) {
  const mins = Math.round(duration / 60)
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span>Danach:</span>
      <span className={`px-2 py-0.5 rounded-full font-medium ${PHASE_BADGE_BG[type] ?? 'bg-slate-100 text-slate-600'}`}>
        {PHASE_LABELS[type] ?? type}
      </span>
      <span>{mins} min</span>
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const {
    status, isPaused, isFinished,
    selectedMode, currentPhase, currentPhaseIndex,
    totalPhases, remainingTimeFormatted, progressFraction,
    sessionProgressFraction, speaker, speakerName,
    phaseInstruction, phaseSubtitle, nextPhase,
    tips, start, pause, resume, stop,
  } = useSession()

  // Redirect if no mode
  useEffect(() => {
    if (!selectedMode && status === 'idle') {
      window.location.href = '/#/'
    }
  }, [selectedMode, status])

  // Auto-start
  useEffect(() => {
    if (selectedMode && status === 'idle') {
      start(selectedMode)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStop = () => { stop(); window.location.href = '/#/' }
  const handlePauseResume = () => isPaused ? resume() : pause()

  // Session abgeschlossen
  if (isFinished) return <SessionCompletedView onDone={() => { stop(); window.location.href = '/#/' }} />

  const phType = currentPhase?.type ?? 'prep'
  const color = PHASE_RING[phType] ?? '#64748b'
  const bgGrad = PHASE_BG[phType] ?? 'from-slate-50 to-slate-100'
  const accentCls = PHASE_ACCENT[phType] ?? 'text-slate-700'
  const badgeCls = PHASE_BADGE_BG[phType] ?? 'bg-slate-100 text-slate-600'
  const phases = selectedMode?.phases ?? []

  return (
    <main
      className={`min-h-screen flex flex-col bg-gradient-to-b ${bgGrad}`}
      style={{ transition: 'background 0.7s ease' }}
    >
      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between px-5 py-4">
        <div className="text-sm font-medium text-slate-500">
          {selectedMode?.name
            ? selectedMode.name.replace('mode.', '').replace('.name', '')
            : 'Sitzung'}
        </div>
        {/* Session-Gesamtfortschritt */}
        <div className="flex-1 mx-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-400 transition-all duration-500"
            style={{ width: `${Math.round(sessionProgressFraction * 100)}%` }}
          />
        </div>
        <div className="text-xs text-slate-400">
          {Math.round(sessionProgressFraction * 100)}%
        </div>
      </header>

      {/* ── PHASE BADGE ── */}
      <div className="flex justify-center pt-2 pb-1">
        <div className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide ${badgeCls}`}
          style={{ transition: 'all 0.4s' }}>
          {PHASE_LABELS[phType] ?? phType} · Phase {currentPhaseIndex + 1}/{totalPhases}
        </div>
      </div>

      {/* ── HAUPTINHALT ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* BIG INSTRUCTION TEXT */}
        <div className="text-center space-y-2 max-w-sm">
          <h2
            className={`font-bold leading-tight ${accentCls}`}
            style={{ fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', transition: 'color 0.4s' }}
          >
            {phaseInstruction}
          </h2>
          {phaseSubtitle && (
            <p className="text-slate-500 text-sm leading-relaxed">
              {phaseSubtitle}
            </p>
          )}
        </div>

        {/* SPEAKER BADGE */}
        {speaker && (
          <div
            className="px-6 py-2.5 rounded-full text-base font-bold tracking-wide shadow-sm"
            style={{
              backgroundColor: speaker === 'A' ? 'rgba(37,99,235,0.12)' : 'rgba(225,29,72,0.12)',
              color: speaker === 'A' ? '#1d4ed8' : '#be123c',
              transition: 'all 0.4s',
            }}
          >
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

        {/* PHASE PROGRESS STRIP */}
        <PhaseStrip
          phases={phases}
          currentIndex={currentPhaseIndex}
          progress={progressFraction}
        />

        {/* NEXT PHASE HINT */}
        {nextPhase && (
          <NextPhaseHint type={nextPhase.type} duration={nextPhase.duration} />
        )}

        {/* TIPS */}
        {tips.length > 0 && !isPaused && (
          <div className="max-w-xs bg-white/60 backdrop-blur-sm rounded-2xl px-5 py-3 text-center border border-white/80">
            <p className="text-xs text-slate-400 font-medium mb-1">Tipp</p>
            <p className="text-sm text-slate-600 leading-relaxed">{tips[0]}</p>
          </div>
        )}
      </div>

      {/* ── CONTROLS ── */}
      <footer className="flex items-center justify-center gap-5 pb-12 pt-6">
        {/* Stop */}
        <button
          onClick={handleStop}
          className="w-14 h-14 rounded-full border-2 border-slate-300 bg-white/80 text-slate-500
            hover:border-red-400 hover:text-red-500 hover:bg-red-50
            flex items-center justify-center shadow-sm transition-all"
          aria-label="Session beenden"
        >
          <Square className="w-5 h-5 fill-current" />
        </button>

        {/* Pause / Resume */}
        <button
          onClick={handlePauseResume}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all
            ${isPaused
              ? 'bg-sky-500 hover:bg-sky-600 text-white border-2 border-sky-500'
              : 'border-2 border-slate-300 bg-white/80 text-slate-500 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50'
            }`}
          aria-label={isPaused ? 'Fortsetzen' : 'Pause'}
        >
          {isPaused
            ? <Play className="w-6 h-6 ml-0.5" />
            : <Pause className="w-6 h-6" />
          }
        </button>
      </footer>

      {/* ── PAUSE OVERLAY ── */}
      {isPaused && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px]" />
          <span className="relative text-slate-500 text-sm font-bold tracking-[0.3em] uppercase">
            Pause
          </span>
        </div>
      )}
    </main>
  )
}
