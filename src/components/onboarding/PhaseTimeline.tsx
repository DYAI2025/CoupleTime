import { motion } from 'framer-motion'

/**
 * Simplified phase display type for onboarding visualization
 */
export interface DisplayPhase {
  type: string
  durationMinutes: number
}

interface PhaseTimelineProps {
  phases: DisplayPhase[]
  totalDuration: number
}

const PHASE_COLORS: Record<string, string> = {
  prep: '#3B82F6',      // blue
  slotA: '#10B981',     // green
  slotB: '#F59E0B',     // orange
  transition: '#8B5CF6', // purple
  closingA: '#EAB308',  // yellow
  closingB: '#EAB308',  // yellow
  cooldown: '#6B7280',  // gray
}

export function PhaseTimeline({ phases, totalDuration }: PhaseTimelineProps) {
  return (
    <div className="w-full">
      {/* Timeline bar */}
      <div className="flex h-12 rounded-lg overflow-hidden shadow-sm">
        {phases.map((phase, index) => {
          const widthPercent = (phase.durationMinutes / totalDuration) * 100
          const color = PHASE_COLORS[phase.type] || '#6B7280'

          return (
            <motion.div
              key={`${phase.type}-${index}`}
              data-testid={`phase-${phase.type}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              style={{
                width: `${widthPercent}%`,
                backgroundColor: color,
              }}
              className="relative flex items-center justify-center"
            >
              {/* Duration label (only show if width > 8%) */}
              {widthPercent > 8 && (
                <span className="text-xs font-semibold text-white">
                  {phase.durationMinutes} min
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Phase labels below */}
      <div className="flex mt-2 text-xs text-gray-600 dark:text-gray-400">
        {phases.map((phase, index) => {
          const widthPercent = (phase.durationMinutes / totalDuration) * 100

          return (
            <div
              key={`label-${phase.type}-${index}`}
              style={{ width: `${widthPercent}%` }}
              className="text-center"
            >
              {widthPercent > 8 && <span>{phase.type}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
