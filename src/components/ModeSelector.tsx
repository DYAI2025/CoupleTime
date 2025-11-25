import { useState } from 'react'
import { useSession, useAvailableModes, useCustomModes } from '../contexts/SessionContext'
import type { SessionMode } from '../domain/SessionMode'
import { getTotalDurationMinutes } from '../domain/SessionMode'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CustomModeEditor } from './CustomModeEditor'

interface ModeSelectorProps {
  /** Currently selected mode */
  selectedMode: SessionMode | null
  /** Callback when mode is selected */
  onSelectMode: (mode: SessionMode) => void
  /** Show custom modes section */
  showCustomModes?: boolean
}

/**
 * Mode selection cards for choosing a session mode
 */
export function ModeSelector({
  selectedMode,
  onSelectMode,
  showCustomModes = true,
}: ModeSelectorProps) {
  const { t } = useTranslation()
  const { presets, customModes } = useSession()
  const { deleteCustomMode } = useCustomModes()
  const [showEditor, setShowEditor] = useState(false)
  const [editingMode, setEditingMode] = useState<SessionMode | null>(null)

  const handleEdit = (mode: SessionMode) => {
    setEditingMode(mode)
    setShowEditor(true)
  }

  const handleDelete = (mode: SessionMode) => {
    if (window.confirm(t('builder.deleteConfirm', 'Are you sure you want to delete this mode?'))) {
      deleteCustomMode(mode.id)
      if (selectedMode?.id === mode.id) {
        onSelectMode(presets[0])
      }
    }
  }

  const handleCreateNew = () => {
    setEditingMode(null)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setEditingMode(null)
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Preset modes */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
            {t('modes.presets', 'Preset Modes')}
          </h2>
          <div className="grid gap-3">
            {presets.map((mode) => (
              <ModeCard
                key={mode.id}
                mode={mode}
                isSelected={selectedMode?.id === mode.id}
                onSelect={() => onSelectMode(mode)}
              />
            ))}
          </div>
        </section>

        {/* Custom modes */}
        {showCustomModes && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
              {t('modes.custom', 'Custom Modes')}
            </h2>
            <div className="grid gap-3">
              {customModes.map((mode) => (
                <ModeCard
                  key={mode.id}
                  mode={mode}
                  isSelected={selectedMode?.id === mode.id}
                  onSelect={() => onSelectMode(mode)}
                  isCustom
                  onEdit={() => handleEdit(mode)}
                  onDelete={() => handleDelete(mode)}
                />
              ))}

              {/* Create new mode button */}
              <button
                onClick={handleCreateNew}
                className="
                  w-full p-4 rounded-xl text-left
                  border-2 border-dashed border-gray-300 dark:border-gray-600
                  hover:border-blue-400 dark:hover:border-blue-500
                  hover:bg-blue-50 dark:hover:bg-blue-900/20
                  transition-colors group
                "
              >
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <PlusIcon className="w-6 h-6" />
                  <span className="font-medium">
                    {t('builder.createNew', 'Create New Mode')}
                  </span>
                </div>
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {showEditor && (
          <CustomModeEditor
            editingMode={editingMode}
            onClose={handleCloseEditor}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Individual mode card
 */
function ModeCard({
  mode,
  isSelected,
  onSelect,
  isCustom = false,
  onEdit,
  onDelete,
}: {
  mode: SessionMode
  isSelected: boolean
  onSelect: () => void
  isCustom?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const durationMinutes = getTotalDurationMinutes(mode)
  const roundCount = mode.phases.filter(p => p.type === 'slotA').length

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`
        w-full p-4 rounded-xl text-left transition-all
        ${isSelected
          ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        shadow-sm hover:shadow-md
      `}
    >
      <div className="flex items-start justify-between">
        <button
          onClick={onSelect}
          className="flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>
              {mode.isLocked ? t(`modes.${mode.id}.name`, mode.name) : mode.name}
            </h3>
            {isCustom && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {t('modes.customBadge', 'Custom')}
              </span>
            )}
          </div>
          {mode.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {mode.isLocked ? t(`modes.${mode.id}.description`, mode.description) : mode.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              ~{durationMinutes} {t('common.minutes', 'min')}
            </span>
            <span className="flex items-center gap-1">
              <CycleIcon className="w-4 h-4" />
              {roundCount} {t('common.rounds', 'rounds')}
            </span>
          </div>
        </button>

        {/* Actions & Selection */}
        <div className="flex items-start gap-2">
          {/* Edit/Delete buttons for custom modes */}
          {isCustom && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 text-gray-400 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  aria-label={t('common.edit', 'Edit')}
                >
                  <EditIcon className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  aria-label={t('common.delete', 'Delete')}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Selection indicator */}
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
            ${isSelected
              ? 'bg-blue-500 dark:bg-blue-400'
              : 'border-2 border-gray-300 dark:border-gray-600'
            }
          `}>
            {isSelected && (
              <CheckIcon className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Compact mode selector dropdown
 */
export function ModeSelectorDropdown({
  selectedMode,
  onSelectMode,
}: {
  selectedMode: SessionMode | null
  onSelectMode: (mode: SessionMode) => void
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const modes = useAvailableModes()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full px-4 py-3 rounded-xl
          bg-white dark:bg-gray-800
          border-2 border-gray-200 dark:border-gray-700
          hover:border-gray-300 dark:hover:border-gray-600
          flex items-center justify-between
          transition-colors
        "
      >
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {selectedMode
            ? (selectedMode.isLocked ? t(`modes.${selectedMode.id}.name`, selectedMode.name) : selectedMode.name)
            : t('modes.selectMode', 'Select a mode...')
          }
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute z-50 w-full mt-2
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-xl shadow-lg
              max-h-64 overflow-y-auto
            "
          >
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  onSelectMode(mode)
                  setIsOpen(false)
                }}
                className={`
                  w-full px-4 py-3 text-left
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  ${selectedMode?.id === mode.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                  first:rounded-t-xl last:rounded-b-xl
                  transition-colors
                `}
              >
                <div className="font-medium text-gray-700 dark:text-gray-200">
                  {mode.isLocked ? t(`modes.${mode.id}.name`, mode.name) : mode.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ~{getTotalDurationMinutes(mode)} {t('common.minutes', 'min')}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Icons
function ClockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CycleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function CheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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

function PlusIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function EditIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

export default ModeSelector
