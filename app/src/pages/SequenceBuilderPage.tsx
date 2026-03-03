/**
 * SequenceBuilderPage – vollständiger Custom-Session-Builder.
 * Jede Phase hat: Typ, Name, Dauer (mm:ss), FocusText, Sound.
 * Baut eine SessionMode und startet sie direkt.
 */
import { useState, useMemo } from 'react'
import { useSession } from '@/viewModel/SessionContext'
import type { PhaseConfig, SoundType } from '@/domain/PhaseConfig'
import { createPhaseConfig, formatDurationShort } from '@/domain/PhaseConfig'
import type { PhaseType } from '@/domain/PhaseType'
import { createCustomModeTemplate } from '@/domain/SessionMode'
import type { SessionMode } from '@/domain/SessionMode'
import { SOUND_LABELS, getAudioService } from '@/services/AudioService'
import { ChevronLeft, Play, Plus, Trash2, ArrowUp, ArrowDown, Volume2 } from 'lucide-react'

// ── Farb-Mapping ──────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  slotA:      '#3b82f6',
  slotB:      '#e11d48',
  transition: '#f59e0b',
  prep:       '#94a3b8',
  closingA:   '#60a5fa',
  closingB:   '#fb7185',
  cooldown:   '#10b981',
}
const TYPE_LABELS: Record<string, string> = {
  slotA:      'A spricht',
  slotB:      'B spricht',
  transition: 'Übergang',
  prep:       'Vorbereitung',
  closingA:   'Abschluss A',
  closingB:   'Abschluss B',
  cooldown:   'Ausklang',
}
const QUICK_TEMPLATES: Array<{ type: PhaseType; label: string; defaultMin: number; defaultSec: number }> = [
  { type: 'slotA',      label: 'A spricht',  defaultMin: 5, defaultSec: 0 },
  { type: 'slotB',      label: 'B spricht',  defaultMin: 5, defaultSec: 0 },
  { type: 'transition', label: 'Übergang',   defaultMin: 1, defaultSec: 0 },
  { type: 'prep',       label: 'Vorbereitung', defaultMin: 1, defaultSec: 0 },
  { type: 'cooldown',   label: 'Ausklang',   defaultMin: 5, defaultSec: 0 },
]

// ── EditablePhase ─────────────────────────────────────────────────────────────
interface EditablePhase {
  id: string
  type: PhaseType
  label: string       // custom display label
  minutes: number
  seconds: number
  focusText: string
  soundType: SoundType
}

function toPhaseConfig(e: EditablePhase): PhaseConfig {
  return createPhaseConfig(
    e.id, e.type, e.minutes * 60 + e.seconds,
    undefined,
    { label: e.label || undefined, focusText: e.focusText || undefined, soundType: e.soundType }
  )
}

function newPhase(type: PhaseType, minutes = 5, seconds = 0): EditablePhase {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type, label: '', minutes, seconds,
    focusText: '', soundType: 'SINGING_BOWL',
  }
}

// ── PhaseCard ─────────────────────────────────────────────────────────────────
function PhaseCard({
  phase, index, total, nameA, nameB,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  phase: EditablePhase; index: number; total: number
  nameA: string; nameB: string
  onChange: (p: EditablePhase) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const color = TYPE_COLORS[phase.type] ?? '#64748b'
  const dur = phase.minutes * 60 + phase.seconds

  const previewSound = async (s: SoundType) => {
    const audio = getAudioService()
    await audio.enable()
    await audio.playSound(s)
  }

  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm"
      style={{ borderLeft: `4px solid ${color}` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">{index + 1}</span>
          <span className="text-sm font-semibold" style={{ color }}>
            {TYPE_LABELS[phase.type] ?? phase.type}
          </span>
          <span className="text-xs text-slate-400 ml-2">
            {formatDurationShort(dur)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp}   disabled={index === 0}
            className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-1 rounded text-red-300 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Type selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Phase-Typ</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_LABELS) as PhaseType[]).map(t => (
              <button key={t}
                onClick={() => onChange({ ...phase, type: t })}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: phase.type === t ? TYPE_COLORS[t] : 'transparent',
                  color: phase.type === t ? '#fff' : TYPE_COLORS[t],
                  border: `1.5px solid ${TYPE_COLORS[t]}`,
                }}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Dauer</label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <input type="number" min={0} max={60} value={phase.minutes}
                onChange={e => onChange({ ...phase, minutes: Math.max(0, Math.min(60, +e.target.value || 0)) })}
                className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-center text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-xs text-slate-400">min</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="number" min={0} max={59} step={5} value={phase.seconds}
                onChange={e => onChange({ ...phase, seconds: Math.max(0, Math.min(59, +e.target.value || 0)) })}
                className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-center text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-xs text-slate-400">sec</span>
            </div>
          </div>
        </div>

        {/* Custom label */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Eigener Name <span className="text-slate-300">(optional)</span>
          </label>
          <input type="text" value={phase.label} maxLength={60}
            placeholder={TYPE_LABELS[phase.type]}
            onChange={e => onChange({ ...phase, label: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-slate-300"
          />
        </div>

        {/* Focus text */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Anweisung auf dem Bildschirm <span className="text-slate-300">(optional, {'{nameA}'}/{'{nameB}'})</span>
          </label>
          <textarea value={phase.focusText} maxLength={300}
            rows={2}
            placeholder={`z.B. "${phase.type === 'slotA' ? nameA : phase.type === 'slotB' ? nameB : 'Bitte'} spricht über sich – nicht über den anderen."`}
            onChange={e => onChange({ ...phase, focusText: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-slate-300"
          />
          <div className="text-right text-xs text-slate-300 mt-0.5">{phase.focusText.length}/300</div>
        </div>

        {/* Sound */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Volume2 className="w-3 h-3 text-slate-400" />
            <label className="text-xs text-slate-400">Ton am Phasen-Ende</label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SOUND_LABELS) as SoundType[]).map(s => (
              <button key={s}
                onClick={() => { onChange({ ...phase, soundType: s }); previewSound(s) }}
                className="px-2.5 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: phase.soundType === s ? '#3b82f6' : 'transparent',
                  color: phase.soundType === s ? '#fff' : '#64748b',
                  border: '1.5px solid ' + (phase.soundType === s ? '#3b82f6' : '#e2e8f0'),
                }}>
                {SOUND_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────
function TimelineBar({ phases }: { phases: EditablePhase[] }) {
  const total = phases.reduce((s, p) => s + p.minutes * 60 + p.seconds, 0)
  if (total === 0) return null
  return (
    <div className="flex h-6 rounded-lg overflow-hidden border border-slate-200">
      {phases.map(p => {
        const dur = p.minutes * 60 + p.seconds
        const pct = (dur / total) * 100
        if (pct < 0.5) return null
        return (
          <div key={p.id} title={`${TYPE_LABELS[p.type]} – ${formatDurationShort(dur)}`}
            style={{ width: `${pct}%`, background: TYPE_COLORS[p.type] ?? '#94a3b8', minWidth: 4 }}
            className="flex items-center justify-center overflow-hidden">
            {pct > 8 && <span className="text-white text-[10px] font-semibold px-1">{formatDurationShort(dur)}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────
export default function SequenceBuilderPage() {
  const { start, nameA, nameB } = useSession()

  const [sessionName, setSessionName] = useState('Eigene Sitzung')
  const [phases, setPhases] = useState<EditablePhase[]>(() => {
    const t = createCustomModeTemplate()
    return t.phases.map(p => ({
      id: p.id, type: p.type as PhaseType,
      label: p.label ?? '',
      minutes: Math.floor(p.duration / 60),
      seconds: p.duration % 60,
      focusText: p.focusText ?? '',
      soundType: (p.soundType as SoundType) ?? 'SINGING_BOWL',
    }))
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const totalSec = phases.reduce((s, p) => s + p.minutes * 60 + p.seconds, 0)

  const updatePhase = (idx: number, p: EditablePhase) => {
    setPhases(prev => { const n = [...prev]; n[idx] = p; return n })
  }
  const deletePhase = (idx: number) => setPhases(prev => prev.filter((_, i) => i !== idx))
  const moveUp = (idx: number) => {
    if (idx === 0) return
    setPhases(prev => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n })
  }
  const moveDown = (idx: number) => {
    if (idx === phases.length - 1) return
    setPhases(prev => { const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n })
  }

  const addQuick = (t: typeof QUICK_TEMPLATES[0]) => {
    setPhases(prev => [...prev, newPhase(t.type, t.defaultMin, t.defaultSec)])
  }

  const validate = (): boolean => {
    const errs: string[] = []
    if (!phases.some(p => p.type === 'slotA')) errs.push('Mindestens eine "A spricht"-Phase erforderlich.')
    if (!phases.some(p => p.type === 'slotB')) errs.push('Mindestens eine "B spricht"-Phase erforderlich.')
    if (phases.some(p => p.minutes * 60 + p.seconds < 30)) errs.push('Jede Phase muss mindestens 30 Sekunden dauern.')
    setErrors(errs)
    return errs.length === 0
  }

  const mode: SessionMode = useMemo(() => ({
    id: `custom-${Date.now()}`,
    name: sessionName || 'Eigene Sitzung',
    phases: phases.map(toPhaseConfig),
    guidanceLevel: 'moderate',
    isLocked: false, isPreset: false,
  }), [sessionName, phases])

  const handleStart = async () => {
    if (!validate()) return
    await start(mode)
    window.location.hash = '#/session'
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input type="text" value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            maxLength={50}
            className="flex-1 bg-transparent text-lg font-bold text-slate-800 focus:outline-none"
            placeholder="Session-Name"
          />
          <span className="text-xs text-slate-400 shrink-0">
            {formatDurationShort(totalSec)}
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            {errors.map((e, i) => <p key={i} className="text-sm text-red-600">⚠ {e}</p>)}
          </div>
        )}

        {/* Timeline */}
        {phases.length > 0 && (
          <div className="space-y-1">
            <TimelineBar phases={phases} />
            <p className="text-xs text-slate-400 text-right">
              {phases.length} Phasen · {formatDurationShort(totalSec)}
            </p>
          </div>
        )}

        {/* Empty state */}
        {phases.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-400 text-sm">Noch keine Phasen. Füge deine erste Phase hinzu.</p>
          </div>
        )}

        {/* Phase cards */}
        {phases.map((p, i) => (
          <PhaseCard key={p.id} phase={p} index={i} total={phases.length}
            nameA={nameA} nameB={nameB}
            onChange={updated => updatePhase(i, updated)}
            onDelete={() => deletePhase(i)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
          />
        ))}

        {/* Quick add */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Schnell hinzufügen
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TEMPLATES.map(t => (
              <button key={t.type} onClick={() => addQuick(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: TYPE_COLORS[t.type] + '18', color: TYPE_COLORS[t.type], border: `1.5px solid ${TYPE_COLORS[t.type]}40` }}>
                <Plus className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                border border-dashed border-slate-300 text-slate-500 hover:border-slate-400">
              <Plus className="w-3.5 h-3.5" />
              Eigene Phase
            </button>
          </div>
        </div>

        {/* Custom add form */}
        {showAddForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-600 mb-3">Eigene Phase</p>
            <p className="text-xs text-slate-400 mb-3">
              Wähle einen Typ und konfiguriere ihn nach deinen Wünschen.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_TEMPLATES.map(t => (
                <button key={t.type}
                  onClick={() => { addQuick(t); setShowAddForm(false) }}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium border transition-all"
                  style={{ borderColor: TYPE_COLORS[t.type], color: TYPE_COLORS[t.type] }}>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddForm(false)}
              className="text-sm text-slate-400 hover:text-slate-600">
              Abbrechen
            </button>
          </div>
        )}
      </div>

      {/* Start button (sticky bottom) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-4">
        <div className="max-w-xl mx-auto">
          <button onClick={handleStart}
            disabled={phases.length === 0}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl
              bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed
              text-white text-lg font-semibold shadow-lg transition-all active:scale-95">
            <Play className="w-6 h-6" />
            Session starten
          </button>
        </div>
      </div>
    </main>
  )
}
