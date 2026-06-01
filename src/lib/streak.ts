function isoForOffset(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * Count consecutive activity days ending today. Grace rule: if there is no
 * activity *today* yet but there was yesterday, count the streak from
 * yesterday backwards — so the streak doesn't appear to drop at midnight.
 */
export function calcStreak(activityDays: string[]): number {
  if (activityDays.length === 0) return 0
  const set = new Set(activityDays)
  let offset = set.has(isoForOffset(0)) ? 0 : set.has(isoForOffset(1)) ? 1 : -1
  if (offset === -1) return 0
  let n = 0
  while (set.has(isoForOffset(offset))) {
    n++
    offset++
  }
  return n
}

export type StreakDay = {
  iso: string
  active: boolean
  isToday: boolean
  /** Single-letter weekday label (Mon→M, Tue→T, …). */
  letter: string
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** Returns the last 7 days, ordered oldest → newest (today is the rightmost). */
export function lastSevenDays(activityDays: string[]): StreakDay[] {
  const set = new Set(activityDays)
  const today = new Date()
  const todayIso = isoForOffset(0)
  return Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i
    const iso = isoForOffset(offset)
    const d = new Date(today)
    d.setDate(d.getDate() - offset)
    return {
      iso,
      active: set.has(iso),
      isToday: iso === todayIso,
      letter: WEEKDAY_LETTERS[d.getDay()],
    }
  })
}
