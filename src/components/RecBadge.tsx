interface RecBadgeProps {
  isRecording: boolean
  recordingEnabled?: boolean
}

export function RecBadge({ isRecording, recordingEnabled = true }: RecBadgeProps) {
  if (!isRecording || !recordingEnabled) return null

  return (
    <div role="status" aria-live="polite" aria-label="Recording active" className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-xs font-bold text-red-600 dark:text-red-400 tracking-widest">REC</span>
    </div>
  )
}
