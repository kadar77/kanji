import { LEVEL_SYSTEMS } from '@/lib/levels'
import type { LevelSystemId } from '@/types'

export function LevelChip({ system, level }: { system: LevelSystemId; level: string }) {
  const def = LEVEL_SYSTEMS[system].levels.find((l) => l.id === level)
  const label = def?.shortLabel ?? level
  const cls = system === 'jlpt' ? `lvl-${level.toLowerCase()}` : ''
  return (
    <span className={`chip ${cls}`}>
      {system === 'jlpt' && <span className="chip-dot" />}
      {label}
    </span>
  )
}
