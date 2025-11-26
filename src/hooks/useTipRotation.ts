import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export interface TipRotationConfig {
  /** Array of tips */
  tips: string[]
  /** Enable auto-rotation */
  autoRotate: boolean
  /** Seconds between rotations */
  interval: number
  /** Use shuffle mode (show each once before repeat) */
  shuffleMode: boolean
}

export interface TipRotationState {
  /** Current tip */
  current: string
  /** Current index in original array */
  currentIndex: number
  /** Total number of tips */
  total: number
  /** Advance to next tip */
  next: () => void
  /** Go to previous tip */
  previous: () => void
  /** Go to specific index */
  goTo: (index: number) => void
}

export function useTipRotation(config: TipRotationConfig): TipRotationState {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([])

  // Initialize shuffled indices
  useEffect(() => {
    if (config.shuffleMode && config.tips.length > 0) {
      const indices = Array.from({ length: config.tips.length }, (_, i) => i)
      setShuffledIndices(shuffleArray(indices))
      setCurrentIndex(0)
    }
  }, [config.tips.length, config.shuffleMode])

  // Auto-rotation timer
  useEffect(() => {
    if (!config.autoRotate || config.tips.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIdx = (prev + 1) % config.tips.length
        // Reshuffle when deck is exhausted
        if (nextIdx === 0 && config.shuffleMode) {
          setTimeout(() => {
            const indices = Array.from({ length: config.tips.length }, (_, i) => i)
            setShuffledIndices(shuffleArray(indices))
          }, 100)
        }
        return nextIdx
      })
    }, config.interval * 1000)

    return () => clearInterval(timer)
  }, [config.autoRotate, config.interval, config.tips.length, config.shuffleMode])

  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIdx = (prev + 1) % config.tips.length
      if (nextIdx === 0 && config.shuffleMode) {
        const indices = Array.from({ length: config.tips.length }, (_, i) => i)
        setShuffledIndices(shuffleArray(indices))
      }
      return nextIdx
    })
  }, [config.tips.length, config.shuffleMode])

  const previous = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + config.tips.length) % config.tips.length)
  }, [config.tips.length])

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < config.tips.length) {
        setCurrentIndex(index)
      }
    },
    [config.tips.length]
  )

  const current = useMemo(() => {
    if (config.tips.length === 0) return ''
    const actualIndex = config.shuffleMode ? shuffledIndices[currentIndex] ?? currentIndex : currentIndex
    return config.tips[actualIndex] ?? ''
  }, [config.tips, config.shuffleMode, shuffledIndices, currentIndex])

  return {
    current,
    currentIndex,
    total: config.tips.length,
    next,
    previous,
    goTo,
  }
}
