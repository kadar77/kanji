import { useEffect, useState } from 'react'
import HanziWriter, { type CharacterData } from 'hanzi-writer'

type Props = {
  character: string
}

/**
 * Renders the kanji built up stroke-by-stroke in a horizontally scrollable
 * row: the first tile shows just stroke 1, the next shows strokes 1–2, …
 * the last shows the full character. The newest stroke in each tile is
 * highlighted with the accent color.
 *
 * Stroke path data comes from Hanzi Writer's CDN. The data uses a coordinate
 * system where y goes from 0 (bottom) to 900 (top), so the group is flipped
 * via `scale(1, -1) translate(0, -900)`.
 */
export function StrokeProgression({ character }: Props) {
  const [data, setData] = useState<CharacterData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    HanziWriter.loadCharacterData(character)
      .then((d) => {
        if (cancelled) return
        if (d?.strokes?.length) setData(d)
        else setError(true)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [character])

  if (error) {
    return (
      <div className="hint-block">Stroke data unavailable for this character.</div>
    )
  }

  if (!data) {
    return (
      <div className="stroke-prog-row" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel stroke-step" />
        ))}
      </div>
    )
  }

  return (
    <div
      className="stroke-prog-row"
      role="list"
      aria-label={`${character} written stroke by stroke`}
    >
      {data.strokes.map((_, i) => (
        <div
          key={i}
          role="listitem"
          className="stroke-step"
          aria-label={`After stroke ${i + 1}`}
        >
          <span className="stroke-step-n">{i + 1}</span>
          <svg viewBox="0 0 1024 1024" className="stroke-step-svg">
            <g transform="scale(1, -1) translate(0, -900)">
              {data.strokes.slice(0, i + 1).map((d, j) => (
                <path
                  key={j}
                  d={d}
                  fill={j === i ? 'oklch(0.6 0.22 25)' : 'var(--ink-2)'}
                  opacity={j === i ? 1 : 0.6}
                />
              ))}
            </g>
          </svg>
        </div>
      ))}
    </div>
  )
}
