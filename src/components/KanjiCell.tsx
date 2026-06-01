import { Icon } from '@/components/Icon'
import { mnIfDifferent } from '@/lib/mn'
import type { Kanji, MasteryLevel } from '@/types'

type Props = {
  kanji: Kanji
  mastery: MasteryLevel
  showFurigana: boolean
  showMongolian: boolean
  /** Controlled flip state — the parent owns "one card flipped at a time". */
  flipped: boolean
  /** Tap the cell to flip it (or flip it back). */
  onTap: () => void
  /** Tap the expand button on the flipped back to open the detail popover. */
  onExpand: () => void
}

export function KanjiCell({
  kanji,
  mastery,
  showFurigana,
  showMongolian,
  flipped,
  onTap,
  onExpand,
}: Props) {
  const top = kanji.kunYomi[0] ?? kanji.onYomi[0] ?? ''
  // Back of the card shows only the primary meaning; the expanded popover
  // shows all of them.
  const meaning = kanji.meanings[0] ?? ''
  const meaningMn = showMongolian
    ? (mnIfDifferent(kanji.meanings[0], kanji.meaningsMn?.[0]) ?? '')
    : ''

  return (
    <button
      type="button"
      className={`kanji-cell ${mastery}`}
      data-flipped={flipped ? 'true' : undefined}
      data-kanji-id={kanji.id}
      onClick={onTap}
      aria-label={`${kanji.character} — ${meaning}`}
    >
      {mastery !== 'new' && <span className="mastery-mark" />}
      <div className="kc-flip">
        <div className="kc-face kc-front">
          <span className="ch">{kanji.character}</span>
          {showFurigana && top && <span className="fr">{top}</span>}
        </div>
        <div className="kc-face kc-back">
          <span className="kc-meaning">{meaning}</span>
          {meaningMn && (
            <span className="kc-meaning" style={{ opacity: 0.7, fontWeight: 400 }}>
              {meaningMn}
            </span>
          )}
          {top && <span className="kc-reading jp">{top}</span>}
          {/* Not a <button> — buttons can't nest. Stop propagation so the
              expand tap doesn't also flip the card back. */}
          <span
            className="kc-expand"
            role="button"
            tabIndex={-1}
            aria-label="Expand details"
            onClick={(e) => {
              e.stopPropagation()
              onExpand()
            }}
          >
            <Icon name="maximize" size={13} stroke={2} />
          </span>
        </div>
      </div>
    </button>
  )
}
