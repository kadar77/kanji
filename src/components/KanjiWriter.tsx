import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { Icon } from '@/components/Icon'
import { useProgressStore } from '@/lib/progress'

type Mode = 'animate' | 'quiz'

export function KanjiWriter({
  character,
  kanjiId,
}: {
  character: string
  kanjiId: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<HanziWriter | null>(null)
  const [mode, setMode] = useState<Mode>('animate')
  const [error, setError] = useState(false)
  const markPracticed = useProgressStore((s) => s.markWritingPracticed)
  const practiced = useProgressStore((s) => s.writingPracticed.includes(kanjiId))

  useEffect(() => {
    if (!containerRef.current) return
    setError(false)
    containerRef.current.innerHTML = ''

    try {
      const writer = HanziWriter.create(containerRef.current, character, {
        width: 240,
        height: 240,
        padding: 12,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 200,
      })
      writerRef.current = writer

      if (mode === 'animate') {
        writer.animateCharacter()
      } else {
        writer.quiz({
          onComplete: () => {
            markPracticed(kanjiId)
          },
        })
      }
    } catch {
      setError(true)
    }

    return () => {
      writerRef.current = null
    }
  }, [character, mode, kanjiId, markPracticed])

  const onWatch = () => {
    if (mode !== 'animate') {
      setMode('animate')
    } else {
      writerRef.current?.animateCharacter()
    }
  }

  const onPractice = () => {
    if (mode !== 'quiz') setMode('quiz')
  }

  if (error) {
    return (
      <div className="hint-block">Stroke data unavailable for this character.</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div className="tabs" style={{ marginBottom: 0, alignSelf: 'stretch' }}>
        <button
          type="button"
          className={mode === 'animate' ? 'active' : ''}
          onClick={onWatch}
        >
          <Icon name="eye" size={14} /> Watch
        </button>
        <button
          type="button"
          className={mode === 'quiz' ? 'active' : ''}
          onClick={onPractice}
        >
          <Icon name="brush" size={14} /> Practice
        </button>
      </div>
      <div
        ref={containerRef}
        style={{
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface)',
        }}
        aria-label={`Write ${character}`}
      />
      {mode === 'animate' && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => writerRef.current?.animateCharacter()}
          style={{ padding: '8px 14px', fontSize: 13 }}
        >
          <Icon name="play" size={14} /> Replay
        </button>
      )}
      {practiced && (
        <p className="muted" style={{ fontSize: 11 }}>
          ✓ Writing practiced
        </p>
      )}
    </div>
  )
}
