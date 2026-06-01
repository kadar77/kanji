import type { MasteryLevel } from '@/types'

type Props = {
  level: MasteryLevel
  onClick: () => void
}

export function MasteryButton({ level, onClick }: Props) {
  const label =
    level === 'known' ? 'Known' : level === 'learning' ? 'Learning' : 'Mark as known'
  return (
    <button type="button" className="mastery" data-m={level} onClick={onClick}>
      <span className="dot" />
      {label}
    </button>
  )
}
