import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '@/components/Icon'
import { mnListIfDifferent } from '@/lib/mn'
import type { Kanji, MasteryLevel } from '@/types'

type Props = {
  kanji: Kanji
  mastery: MasteryLevel
  showMongolian: boolean
  onCycleMastery: () => void
  onClose: () => void
  onOpen: () => void
}

type Pos = { left: number; top: number; ox: number; oy: number; sx: number; sy: number }

/**
 * Detail preview that expands out of the tapped grid cell: its top-left
 * anchors to the cell and it scales up from the card's footprint (origin
 * pinned to the card corner) to a ~2×2-cell popover, with matching rounding.
 */
export function KanjiPopup({
  kanji: k,
  mastery: m,
  showMongolian,
  onCycleMastery,
  onClose,
  onOpen,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const backdrop = el.parentElement as HTMLElement
    const br = backdrop.getBoundingClientRect()
    const cell = document.querySelector<HTMLElement>(
      `.kanji-grid [data-kanji-id="${k.id}"]`,
    )
    let cr: DOMRect | null = null
    let width = 232
    if (cell) {
      cr = cell.getBoundingClientRect()
      width = Math.round(cr.width * 2 + 12) - 8 // ~2 cols + gap, a touch smaller
    }
    el.style.width = width + 'px'
    const pw = el.offsetWidth
    const ph = el.offsetHeight
    const mgn = 10
    let left: number
    let top: number
    let ox = pw / 2
    let oy = ph / 2
    let sx = 0.4
    let sy = 0.4
    if (cr) {
      // Anchor the popup's top-left to the card's top-left, then clamp on-screen.
      const cardL = cr.left - br.left
      const cardT = cr.top - br.top
      left = Math.max(mgn, Math.min(cardL, br.width - pw - mgn))
      top = Math.max(mgn, Math.min(cardT, br.height - ph - mgn))
      // Grow from the card's footprint: origin = card corner within the popup.
      ox = cardL - left
      oy = cardT - top
      sx = cr.width / pw
      sy = cr.height / ph
    } else {
      left = (br.width - pw) / 2
      top = (br.height - ph) / 2
    }
    setPos({ left, top, ox, oy, sx, sy })
  }, [k.id])

  useEffect(() => {
    if (!pos) return
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [pos])

  const meanings = k.meanings.join(', ')
  const meaningsMn = showMongolian ? mnListIfDifferent(k.meanings, k.meaningsMn) : []
  // First five example words, Japanese only (no readings/translations).
  const words = k.vocabulary.slice(0, 5).map((v) => v.word)

  const style: CSSProperties = pos
    ? {
        left: pos.left,
        top: pos.top,
        transformOrigin: `${pos.ox}px ${pos.oy}px`,
        transform: open ? 'scale(1, 1)' : `scale(${pos.sx}, ${pos.sy})`,
        opacity: open ? 1 : 0.5,
        transition:
          'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out',
        visibility: 'visible',
      }
    : { visibility: 'hidden' }

  return (
    <div className="popup-backdrop anchored" onClick={onClose}>
      <div
        ref={ref}
        className="kanji-popup compact"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kp-head">
          <div className="kp-char-wrap">
            <div className="kp-char jp">{k.character}</div>
            <span className="kp-strokes">{k.strokeCount}</span>
          </div>
          {/* Readings take the head slot where meanings used to sit; On and
              Kun stack on separate lines, each with its label inline. */}
          <div className="kp-readings">
            {k.onYomi.length > 0 && (
              <div className="grp">
                <span className="l">On</span>
                <span className="v">{k.onYomi.join('、')}</span>
              </div>
            )}
            {k.kunYomi.length > 0 && (
              <div className="grp">
                <span className="l">Kun</span>
                <span className="v">{k.kunYomi.join('、')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="kp-meaning-block">
          <div className="kp-meaning">{meanings}</div>
          {meaningsMn.length > 0 && (
            <div className="kp-meaning-mn">{meaningsMn.join(', ')}</div>
          )}
        </div>

        {words.length > 0 && (
          <div className="kp-words jp">{words.join('・')}</div>
        )}

        <div className="kp-actions">
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: '0 0 auto', padding: '8px 10px' }}
            onClick={onCycleMastery}
            aria-label="Cycle mastery"
            title="Cycle mastery"
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background:
                  m === 'known'
                    ? 'var(--known-mark)'
                    : m === 'learning'
                      ? 'var(--learning-mark)'
                      : 'transparent',
                border: m === 'new' ? '1.5px solid var(--border-strong)' : 0,
                display: 'inline-block',
              }}
            />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ padding: '8px 10px', fontSize: 13 }}
            onClick={onOpen}
          >
            Open <Icon name="right" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
