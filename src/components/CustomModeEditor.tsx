import { useState, useCallback } from 'react'
import { useCustomModes } from '../contexts/SessionContext'
import type { SessionMode } from '../domain/SessionMode'
import { isSessionModeValid, getValidationErrors, getTotalDurationMinutes } from '../domain/SessionMode'
import type { PhaseConfig } from '../domain/PhaseConfig'
import { createPhaseConfig, PHASE_DURATION_RANGES, formatDuration } from '../domain/PhaseConfig'
import { PhaseType, getAllPhaseTypes, getPhaseDisplayName } from '../domain/PhaseType'
import { GuidanceLevel, getAllGuidanceLevels } from '../domain/GuidanceLevel'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface CustomModeEditorProps {
  /** Mode to edit (null for new mode) */
  editingMode?: SessionMode | null
  /** Callback when editor is closed */
  onClose: () => void
  /** Callback when mode is saved */
  onSave?: (mode: SessionMode) => void
}

/**
 * Editor for creating and editing custom session modes
 */
export function CustomModeEditor({
  editingMode = null,
  onClose,
  onSave,
}: CustomModeEditorProps) {
  const { t } = useTranslation()
  const { addCustomMode, updateCustomMode } = useCustomModes()

  // Form state
  const [name, setName] = useState(editingMode?.name ?? '')
  const [description, setDescription] = useState(editingMode?.description ?? '')
  const [guidanceLevel, setGuidanceLevel] = useState<GuidanceLevel>(
    editingMode?.guidanceLevel ?? GuidanceLevel.Moderate
  )
  const [phases, setPhases] = useState<PhaseConfig[]>(
    editingMode?.phases ?? getDefaultPhases()
  )

  // Validation
  const tempMode = createTempMode(name, phases, guidanceLevel, description)
  const validationErrors = getValidationErrors(tempMode)
  const isValid = isSessionModeValid(tempMode) && name.trim().length > 0

  // Phase management
  const addPhase = useCallback((type: PhaseType) => {
    const range = PHASE_DURATION_RANGES[type]
    const defaultDuration = Math.round((range.min + range.max) / 2)
    setPhases(prev => [...prev, createPhaseConfig(type, defaultDuration)])
  }, [])

  const updatePhase = useCallback((index: number, updates: Partial<PhaseConfig>) => {
    setPhases(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p))
  }, [])

  const removePhase = useCallback((index: number) => {
    setPhases(prev => prev.filter((_, i) => i !== index))
  }, [])

  const movePhase = useCallback((fromIndex: number, toIndex: number) => {
    setPhases(prev => {
      const newPhases = [...prev]
      const [moved] = newPhases.splice(fromIndex, 1)
      newPhases.splice(toIndex, 0, moved)
      return newPhases
    })
  }, [])

  // Save handler
  const handleSave = () => {
    if (!isValid) return

    const mode: SessionMode = {
      id: editingMode?.id ?? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      description: description.trim() || undefined,
      phases,
      guidanceLevel,
      isLocked: false,
      createdAt: editingMode?.createdAt ?? Date.now(),
    }

    if (editingMode) {
      updateCustomMode(mode)
    } else {
      addCustomMode(mode)
    }

    onSave?.(mode)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {editingMode
              ? t('builder.editMode', 'Edit Mode')
              : t('builder.createMode', 'Create Custom Mode')}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('builder.modeName', 'Mode Name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('builder.modeNamePlaceholder', 'e.g., Deep Connection')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('builder.description', 'Description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('builder.descriptionPlaceholder', 'Optional description')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('builder.guidanceLevel', 'Guidance Level')}
              </label>
              <select
                value={guidanceLevel}
                onChange={(e) => setGuidanceLevel(e.target.value as GuidanceLevel)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getAllGuidanceLevels().map(level => (
                  <option key={level} value={level}>
                    {t(`guidanceLevel.${level}`, level)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phases */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('builder.phases', 'Phases')}
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ~{getTotalDurationMinutes(tempMode)} {t('common.minutes', 'min')}
              </span>
            </div>

            {/* Phase list */}
            <Reorder.Group
              axis="y"
              values={phases}
              onReorder={setPhases}
              className="space-y-2"
            >
              <AnimatePresence>
                {phases.map((phase, index) => (
                  <PhaseItem
                    key={phase.id}
                    phase={phase}
                    index={index}
                    onUpdate={(updates) => updatePhase(index, updates)}
                    onRemove={() => removePhase(index)}
                    onMoveUp={index > 0 ? () => movePhase(index, index - 1) : undefined}
                    onMoveDown={index < phases.length - 1 ? () => movePhase(index, index + 1) : undefined}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {/* Add phase buttons */}
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {t('builder.addPhase', 'Add Phase')}:
              </p>
              <div className="flex flex-wrap gap-2">
                {getAllPhaseTypes().map(type => (
                  <button
                    key={type}
                    onClick={() => addPhase(type)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                             text-gray-700 dark:text-gray-300"
                  >
                    + {t(`phases.${type}`, getPhaseDisplayName(type))}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                {t('builder.validationErrors', 'Please fix the following issues')}:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                {validationErrors.map((error, i) => (
                  <li key={i}>{t(error, error)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white font-medium
                     hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            {editingMode
              ? t('common.save', 'Save')
              : t('builder.create', 'Create Mode')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * Individual phase item in the editor
 */
function PhaseItem({
  phase,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  phase: PhaseConfig
  index: number
  onUpdate: (updates: Partial<PhaseConfig>) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const { t } = useTranslation()
  const range = PHASE_DURATION_RANGES[phase.type]
  const isValidDuration = phase.duration >= range.min && phase.duration <= range.max

  return (
    <Reorder.Item
      value={phase}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <GripIcon className="w-5 h-5" />
      </div>

      {/* Phase info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {index + 1}. {t(`phases.${phase.type}`, getPhaseDisplayName(phase.type))}
          </span>
          <PhaseTypeBadge type={phase.type} />
        </div>

        {/* Duration slider */}
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={30}
            value={phase.duration}
            onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className={`text-sm font-mono w-16 text-right ${
            isValidDuration ? 'text-gray-600 dark:text-gray-300' : 'text-red-500'
          }`}>
            {formatDuration(phase.duration)}
          </span>
        </div>

        {/* Range hint */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatDuration(range.min)} - {formatDuration(range.max)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={t('builder.moveUp', 'Move up')}
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={t('builder.moveDown', 'Move down')}
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-600"
          aria-label={t('builder.removePhase', 'Remove phase')}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </Reorder.Item>
  )
}

/**
 * Badge showing phase type color
 */
function PhaseTypeBadge({ type }: { type: PhaseType }) {
  const colorClasses: Record<PhaseType, string> = {
    [PhaseType.Prep]: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    [PhaseType.SlotA]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    [PhaseType.SlotB]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    [PhaseType.Transition]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    [PhaseType.ClosingA]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    [PhaseType.ClosingB]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    [PhaseType.Cooldown]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  }

  return (
    <span className={`px-1.5 py-0.5 text-xs rounded ${colorClasses[type]}`}>
      {type.includes('A') ? 'A' : type.includes('B') ? 'B' : ''}
    </span>
  )
}

// Helper functions

function getDefaultPhases(): PhaseConfig[] {
  return [
    createPhaseConfig(PhaseType.Prep, 120),
    createPhaseConfig(PhaseType.SlotA, 600),
    createPhaseConfig(PhaseType.SlotB, 600),
    createPhaseConfig(PhaseType.Transition, 120),
    createPhaseConfig(PhaseType.SlotA, 600),
    createPhaseConfig(PhaseType.SlotB, 600),
    createPhaseConfig(PhaseType.ClosingA, 180),
    createPhaseConfig(PhaseType.ClosingB, 180),
    createPhaseConfig(PhaseType.Cooldown, 600),
  ]
}

function createTempMode(
  name: string,
  phases: PhaseConfig[],
  guidanceLevel: GuidanceLevel,
  description?: string
): SessionMode {
  return {
    id: 'temp',
    name,
    description,
    phases,
    guidanceLevel,
    isLocked: false,
  }
}

// Icons

function GripIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
  )
}

function ChevronUpIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function TrashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default CustomModeEditor
