import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTipRotation } from '../hooks/useTipRotation'

export interface QuickTipsViewProps {
  tips: string[]
  autoRotate: boolean
  interval: number
  shuffleMode: boolean
}

export function QuickTipsView({ tips, autoRotate, interval, shuffleMode }: QuickTipsViewProps) {
  const { current, currentIndex, total, next, previous } = useTipRotation({
    tips,
    autoRotate,
    interval,
    shuffleMode,
  })

  if (tips.length === 0) {
    return null
  }

  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1

  return (
    <div className="w-full flex flex-col items-center gap-3 px-4">
      <p className="text-base text-gray-700 dark:text-gray-200 text-center min-h-[3rem]">
        {current}
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={previous}
          disabled={isFirst}
          aria-label="Previous tip"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {total}
        </span>
        <button
          onClick={next}
          disabled={isLast}
          aria-label="Next tip"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
