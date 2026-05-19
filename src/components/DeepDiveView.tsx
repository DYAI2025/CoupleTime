import { useTranslation } from 'react-i18next'
import {
  Activity,
  Ban,
  Calendar,
  ClipboardCheck,
  Clock,
  DoorClosed,
  Handshake,
  Heart,
  HelpCircle,
  PlayCircle,
  Users,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'

export interface DeepDiveViewProps {
  tips: string[]
  showAllTips: boolean
}

interface DeepDiveCard {
  title: string
  content: string
  icon: string
}

interface DeepDiveSection {
  title: string
  cards: DeepDiveCard[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  ban: Ban,
  calendar: Calendar,
  'clipboard-check': ClipboardCheck,
  clock: Clock,
  'door-closed': DoorClosed,
  handshake: Handshake,
  heart: Heart,
  'play-circle': PlayCircle,
  users: Users,
  'volume-x': VolumeX,
}

const SECTION_KEYS = ['beforeSession', 'duringListening', 'emergency'] as const

export function DeepDiveView({ tips, showAllTips }: DeepDiveViewProps) {
  const { t } = useTranslation()

  const sections = SECTION_KEYS.map(
    (key) => t(`guidance.deepDive.${key}`, { returnObjects: true }) as DeepDiveSection
  )

  const displayedTips = showAllTips ? tips : tips.slice(0, 1)

  return (
    <div className="overflow-y-auto px-4 py-2 space-y-6">
      {displayedTips.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {t('guidancePanel.phaseTips', 'Phase Tips')}
          </h2>
          <div className="space-y-2">
            {displayedTips.map((tip, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-start gap-3"
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.map((section, si) => (
        <div key={si}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {section.title}
          </h2>
          <div className="space-y-2">
            {(section.cards ?? []).map((card, ci) => {
              const IconComp: LucideIcon = ICON_MAP[card.icon] ?? HelpCircle
              return (
                <div
                  key={ci}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-start gap-3"
                >
                  <IconComp className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {card.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
