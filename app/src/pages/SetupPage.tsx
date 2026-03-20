/**
 * SetupPage – Partner-Namen, Transition-Zeit, Timeline-Visualisierung, Start.
 * Route: /#/setup?preset=<id>
 */
import { useState, useMemo, useEffect } from 'react'
import { useSession } from '@/viewModel/SessionContext'
import { useTranslation } from '@/hooks/useTranslation'
import { getPresetById, PresetModes } from '@/domain/SessionMode'
import { formatDurationShort } from '@/domain/PhaseConfig'
import { Play, ChevronLeft, Clock } from 'lucide-react'

// ── Farben pro Phasen-Typ ─────────────────────────────────────────────────────
const SEGMENT_COLORS: Record<string, string> = {
  prep:       '#94a3b8',
  slotA:      '#3b82f6',
  slotB:      '#e11d48',
  transition: '#f59e0b',
  closingA:   '#60a5fa',
  closingB:   '#fb7185',
  cooldown:   '#10b981',
}

// ── Timeline ─────────────────────────────────────────────────────────────────
function TimelineBar({ phases, nameA, nameB, t }: {
  phases: Array<{ type: string; duration: number; id: string }>
  nameA: string
  nameB: string
  t: (key: string) => string
}) {
  const total = phases.reduce((s, p) => s + p.duration, 0)
  if (total === 0) return null

  const SEGMENT_LABELS: Record<string, string> = {
    prep:       t('phaseLabels.prep'),
    slotA:      `${nameA} ${t('phaseLabels.speaks')}`,
    slotB:      `${nameB} ${t('phaseLabels.speaks')}`,
    transition: t('phaseLabels.transition'),
    closingA:   `${t('phaseLabels.closing')} ${nameA}`,
    closingB:   `${t('phaseLabels.closing')} ${nameB}`,
    cooldown:   t('phaseLabels.cooldown'),
  }

  function label(type: string) {
    return SEGMENT_LABELS[type] ?? type
  }

  return (
    <div className="space-y-3">
      <div className="flex h-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        {phases.map(p => {
          const pct = (p.duration / total) * 100
          if (pct < 0.5) return null
          return (
            <div
              key={p.id}
              title={`${label(p.type)} – ${formatDurationShort(p.duration)}`}
              style={{
                width: `${pct}%`,
                background: SEGMENT_COLORS[p.type] ?? '#94a3b8',
                minWidth: pct > 2 ? undefined : 4,
              }}
              className="relative group flex items-center justify-center overflow-hidden"
            >
              {pct > 8 && (
                <span className="text-white text-[10px] font-semibold truncate px-1">
                  {formatDurationShort(p.duration)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {(['slotA','slotB','transition','closingA','closingB','cooldown','prep'] as const).map(type => {
          if (!phases.some(p => p.type === type)) return null
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: SEGMENT_COLORS[type] }} />
              <span className="text-xs text-slate-500">{label(type)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const { nameA, nameB, transitionSec, setParticipant, setTransitionSec, start } = useSession()
  const { t } = useTranslation()

  const presetId = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('preset') ?? ''
  const baseMode = getPresetById(presetId) ?? Object.values(PresetModes)[0]

  const [localNameA, setLocalNameA] = useState(nameA)
  const [localNameB, setLocalNameB] = useState(nameB)
  const [localTrans, setLocalTrans] = useState(transitionSec)
  const [transInput, setTransInput] = useState(String(transitionSec))

  useEffect(() => {
    setLocalTrans(baseMode.defaultTransitionSec ?? transitionSec)
    setTransInput(String(baseMode.defaultTransitionSec ?? transitionSec))
  }, [presetId])// eslint-disable-line react-hooks/exhaustive-deps

  const mode = useMemo(() => {
    const phases = baseMode.phases.map(p =>
      p.type === 'transition'
        ? { ...p, duration: localTrans }
        : p
    )
    return { ...baseMode, phases }
  }, [baseMode, localTrans])

  const totalSec = mode.phases.reduce((s, p) => s + p.duration, 0)

  const handleStart = async () => {
    setParticipant(localNameA || 'Partner A', localNameB || 'Partner B')
    setTransitionSec(localTrans)
    await start(mode)
    window.location.hash = '#/session'
  }

  const handleTransSlider = (v: number) => {
    setLocalTrans(v)
    setTransInput(String(v))
  }
  const handleTransInput = () => {
    const v = parseInt(transInput)
    if (!isNaN(v)) {
      const clamped = Math.min(300, Math.max(0, v))
      setLocalTrans(clamped)
      setTransInput(String(clamped))
    }
  }

  const isQuick = localTrans <= 30

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-6 max-w-lg mx-auto">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> {t("setup.back")}
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{baseMode.name}</h1>
        {baseMode.description && (
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">{baseMode.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3 text-slate-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>{t("setup.totalDuration")} <strong className="text-slate-600">{formatDurationShort(totalSec)}</strong></span>
        </div>
      </div>

      {/* ── Partner-Namen ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t("setup.partnerNames")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t("setup.personA")}</label>
            <input
              type="text"
              value={localNameA}
              onChange={e => setLocalNameA(e.target.value)}
              placeholder={t("setup.partnerAPlaceholder")}
              maxLength={30}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800
                text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t("setup.personB")}</label>
            <input
              type="text"
              value={localNameB}
              onChange={e => setLocalNameB(e.target.value)}
              placeholder={t("setup.partnerBPlaceholder")}
              maxLength={30}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800
                text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {t("setup.namesHint")}
        </p>
      </section>

      {/* ── Transition-Zeit ── */}
      {mode.phases.some(p => p.type === 'transition') && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {t("setup.transitionPause")}
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            {t("setup.transitionDesc")}
          </p>

          <input
            type="range"
            min={0} max={300} step={5}
            value={localTrans}
            onChange={e => handleTransSlider(Number(e.target.value))}
            className="w-full accent-amber-500"
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={300}
                value={transInput}
                onChange={e => setTransInput(e.target.value)}
                onBlur={handleTransInput}
                onKeyDown={e => e.key === 'Enter' && handleTransInput()}
                className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-center text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-sm text-slate-500">{t("setup.seconds")}</span>
            </div>
            <span className="text-xs text-amber-600 font-medium">
              {isQuick ? t("setup.minimal") : localTrans >= 120 ? t("setup.generous") : t("setup.standard")}
            </span>
          </div>

          {localTrans === 0 && (
            <p className="text-xs text-amber-500 mt-1">
              {t("setup.noTransition")}
            </p>
          )}
        </section>
      )}

      {/* ── Timeline ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          {t("setup.preview")}
        </h2>
        <TimelineBar phases={mode.phases} nameA={localNameA || 'A'} nameB={localNameB || 'B'} t={t} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div>
            {t("setup.phases")} <strong className="text-slate-700">{mode.phases.length}</strong>
          </div>
          <div>
            {t("setup.totalDurationLabel")} <strong className="text-slate-700">{formatDurationShort(totalSec)}</strong>
          </div>
          {mode.phases.some(p => p.type === 'slotA') && (
            <div>
              {t("setup.rounds")} <strong className="text-slate-700">
                {mode.phases.filter(p => p.type === 'slotA').length}×
              </strong>
            </div>
          )}
          {mode.phases.some(p => p.type === 'cooldown' && p.duration > 0) && (
            <div>
              {t("setup.cooldownPause")} <strong className="text-slate-700">
                {formatDurationShort(mode.phases.find(p => p.type === 'cooldown')!.duration)}
              </strong>
            </div>
          )}
        </div>
      </section>

      {/* ── Start ── */}
      <button
        onClick={handleStart}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl
          bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-lg
          transition-all active:scale-95"
      >
        <Play className="w-6 h-6" />
        {t("setup.startSession")}
      </button>

      <p className="text-xs text-slate-400 text-center mt-4">
        {t("setup.startHint")}
      </p>
    </main>
  )
}
