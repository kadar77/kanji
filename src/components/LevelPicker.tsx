import { LEVEL_SYSTEMS } from '@/lib/levels'
import type { LevelSystemId } from '@/types'

type SystemPickerProps = {
  system: LevelSystemId
  onChange: (s: LevelSystemId) => void
}

export function LevelSystemPicker({ system, onChange }: SystemPickerProps) {
  return (
    <div className="segmented full">
      {(Object.entries(LEVEL_SYSTEMS) as [LevelSystemId, (typeof LEVEL_SYSTEMS)[LevelSystemId]][]).map(
        ([id, cfg]) => (
          <button
            key={id}
            type="button"
            className={system === id ? 'active' : ''}
            onClick={() => onChange(id)}
          >
            {cfg.label}
          </button>
        ),
      )}
    </div>
  )
}

type PillsProps = {
  system: LevelSystemId
  level: string
  onChange: (lvl: string) => void
  available?: Set<string>
}

export function LevelPills({ system, level, onChange, available }: PillsProps) {
  const cfg = LEVEL_SYSTEMS[system]
  const isJlpt = system === 'jlpt'
  return (
    <div className="level-row">
      {cfg.levels.map((lvl) => {
        const has = !available || available.has(lvl.id)
        const dotCls = isJlpt ? `lvl-${lvl.id.toLowerCase()}` : ''
        return (
          <button
            key={lvl.id}
            type="button"
            disabled={!has}
            className={`level-pill ${level === lvl.id ? 'active' : ''} ${
              !has ? 'disabled' : ''
            } ${dotCls}`}
            onClick={() => has && onChange(lvl.id)}
          >
            {isJlpt && <span className="dot" />}
            {lvl.shortLabel}
          </button>
        )
      })}
    </div>
  )
}
