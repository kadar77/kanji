import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { LevelChip } from '@/components/LevelChip'
import { MasteryButton } from '@/components/MasteryButton'
import { loadKanji, matchesKanjiQuery } from '@/lib/kanji'
import { filterByCurriculum } from '@/lib/levels'
import { mnListIfDifferent, mnIfDifferent } from '@/lib/mn'
import { useProgressStore } from '@/lib/progress'
import type { Kanji, LevelSystemId, MasteryLevel } from '@/types'

type DeckFilter = 'all' | 'new' | 'learning' | 'known'

function parseDeckFilter(value: string | null): DeckFilter {
  return value === 'new' || value === 'learning' || value === 'known' ? value : 'all'
}

export function CardDeckPage() {
  const { system, level } = useParams<{ system: string; level: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const curriculum = useMemo(
    () => ({ system: (system as LevelSystemId) ?? 'jlpt', level: level ?? 'N5' }),
    [system, level],
  )
  const filter = parseDeckFilter(params.get('filter'))
  const query = params.get('q') ?? ''
  const startId = params.get('start')
  const [kanji, setKanji] = useState<Kanji[]>([])
  const [index, setIndex] = useState(0)
  const [flippedId, setFlippedId] = useState<string | null>(null)
  const [dragDx, setDragDx] = useState(0)
  const { getMastery, cycleMastery, settings } = useProgressStore()
  const markStudied = useProgressStore((s) => s.markStudied)

  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const suppressNextClick = useRef(false)
  const SWIPE_THRESHOLD = 70

  useEffect(() => {
    loadKanji().then((all) => {
      let deck = filterByCurriculum(all, curriculum)
      if (filter !== 'all') {
        const getCurrentMastery = useProgressStore.getState().getMastery
        deck = deck.filter((k) => getCurrentMastery(k.id) === filter)
      }
      const q = query.trim()
      if (q) deck = deck.filter((k) => matchesKanjiQuery(k, q))
      const startIndex = startId ? deck.findIndex((k) => k.id === startId) : -1
      setKanji(deck)
      setIndex(startIndex >= 0 ? startIndex : 0)
      setDragDx(0)
      setFlippedId(null)
    })
  }, [curriculum, filter, query, startId])

  useEffect(() => {
    const current = kanji[index]
    if (current) markStudied(current.id)
  }, [index, kanji, markStudied])

  const go = useCallback(
    (delta: number) =>
      setIndex((i) => Math.max(0, Math.min(kanji.length - 1, i + delta))),
    [kanji.length],
  )

  const onCardPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY }
    dragging.current = false
  }

  const onCardPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (!dragging.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      dragging.current = true
    }
    if (dragging.current) {
      // Resist past the deck edges so it feels like there's nothing there.
      const atEdge =
        (dx > 0 && index === 0) || (dx < 0 && index >= kanji.length - 1)
      setDragDx(atEdge ? dx * 0.25 : dx)
    }
  }

  const finishDrag = (commit: boolean, dx: number) => {
    if (commit && dx > 0 && index > 0) go(-1)
    else if (commit && dx < 0 && index < kanji.length - 1) go(1)
    setDragDx(0)
    if (dragging.current) suppressNextClick.current = true
    dragging.current = false
    dragStart.current = null
  }

  const onCardPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    finishDrag(dragging.current && Math.abs(dx) > SWIPE_THRESHOLD, dx)
  }

  const onCardPointerCancel = () => {
    finishDrag(false, 0)
  }

  const onCardClick = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false
      return
    }
    const current = kanji[index]
    if (!current) return
    setFlippedId((id) => (id === current.id ? null : current.id))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === ' ') {
        e.preventDefault()
        const current = kanji[index]
        if (!current) return
        setFlippedId((id) => (id === current.id ? null : current.id))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index, kanji])

  if (!kanji.length) {
    return (
      <div className="screen-inner">
        <div className="hint-block">
          No kanji. <Link to="/cards">Back to Cards</Link>
        </div>
      </div>
    )
  }

  const k = kanji[index]
  const m = getMastery(k.id) as MasteryLevel
  const flipped = flippedId === k.id
  const showMn = settings.showMongolian
  const meaningsMnVisible = showMn ? mnListIfDifferent(k.meanings, k.meaningsMn) : []

  return (
    <div className="screen-inner fade-in" style={{ paddingTop: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '8px 10px' }}
          onClick={() => navigate('/cards')}
        >
          <Icon name="left" size={16} /> Cards
        </button>
        <LevelChip system={curriculum.system} level={curriculum.level} />
        <div className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          {index + 1} / {kanji.length}
        </div>
      </div>

      <div className="progress" style={{ marginBottom: 24 }}>
        <div style={{ width: `${((index + 1) / kanji.length) * 100}%` }} />
      </div>

      <div
        className="flash flip-in"
        key={`${k.id}:${flipped}`}
        onClick={onCardClick}
        onPointerDown={onCardPointerDown}
        onPointerMove={onCardPointerMove}
        onPointerUp={onCardPointerUp}
        onPointerCancel={onCardPointerCancel}
        style={{
          transform: dragDx !== 0 ? `translateX(${dragDx}px) rotate(${dragDx * 0.02}deg)` : undefined,
          opacity: dragDx !== 0 ? 1 - Math.min(Math.abs(dragDx) / 500, 0.25) : 1,
          transition:
            dragDx !== 0
              ? 'none'
              : 'transform 0.3s var(--ease-out), opacity 0.3s var(--ease-out)',
          touchAction: 'pan-y',
        }}
      >
        {!flipped ? (
          <>
            <div className="flash-kanji jp">{k.character}</div>
            <div className="hint">Tap to flip · swipe to navigate</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {k.meanings.join(', ')}
            </div>
            {meaningsMnVisible.length > 0 && (
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {meaningsMnVisible.join(', ')}
              </div>
            )}
            <div className="muted jp" style={{ fontSize: 14, marginTop: 8 }}>
              {k.onYomi.join('、')}
              {k.kunYomi.length ? ` · ${k.kunYomi.join('、')}` : ''}
            </div>
            {k.vocabulary.length > 0 && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: '1px solid var(--hairline)',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div className="label-up muted" style={{ marginBottom: 6 }}>
                  Examples
                </div>
                {k.vocabulary.slice(0, 2).map((v, i) => (
                  <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
                    <span className="jp" style={{ fontWeight: 500 }}>
                      {v.word}
                    </span>
                    <span className="muted jp" style={{ fontSize: 11 }}>
                      {' · '}
                      {v.reading}
                    </span>
                    <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>
                      {v.meaning}
                      {showMn && mnIfDifferent(v.meaning, v.meaningMn) ? (
                        <span style={{ opacity: 0.8 }}> · {v.meaningMn}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <MasteryButton level={m} onClick={() => cycleMastery(k.id)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, gap: 10 }}>
        <button
          type="button"
          className="btn btn-outline"
          disabled={index === 0}
          onClick={() => go(-1)}
        >
          <Icon name="left" size={16} /> Prev
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() =>
            navigate(`/cards/${curriculum.system}/${curriculum.level}/${k.id}`)
          }
        >
          <Icon name="eye" size={16} /> Details
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={index >= kanji.length - 1}
          onClick={() => go(1)}
        >
          Next <Icon name="right" size={16} />
        </button>
      </div>
    </div>
  )
}
