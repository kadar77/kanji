const BASE_POINTS = 1000
const MAX_BONUS = 500

export function calculateKahootPoints(
  correct: boolean,
  timeLeftMs: number,
  maxTimeMs: number,
): number {
  if (!correct) return 0
  const ratio = Math.max(0, Math.min(1, timeLeftMs / maxTimeMs))
  return Math.round(BASE_POINTS + MAX_BONUS * ratio)
}

export const KAHOOT_QUESTION_TIME_MS = 15_000

export const KAHOOT_COLORS = [
  { bg: 'bg-red-600', hover: 'hover:bg-red-500', label: 'A' },
  { bg: 'bg-blue-600', hover: 'hover:bg-blue-500', label: 'B' },
  { bg: 'bg-amber-500', hover: 'hover:bg-amber-400', label: 'C' },
  { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', label: 'D' },
] as const
