import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { LevelSystemPicker, LevelPills } from '@/components/LevelPicker'
import { loadKanji } from '@/lib/kanji'
import { filterByCurriculum, getAvailableLevels, LEVEL_SYSTEMS } from '@/lib/levels'
import { mnIfDifferent } from '@/lib/mn'
import { useProgressStore } from '@/lib/progress'
import type { Kanji, LevelSystemId } from '@/types'

type Phase = 'setup' | 'play' | 'done'
type CardState = 'down' | 'up' | 'matched' | 'gone'
type MemCard = {
  uid: string
  pairId: string
  kind: 'kanji' | 'meaning'
  display: string
  meaning?: string
  meaningMn?: string
  reading?: string
}

const PAIR_COUNTS = [4, 6, 8] as const

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(pool: Kanji[], pairCount: number): MemCard[] {
  const eligible = pool.filter((k) => {
    const m = k.meanings[0]
    return m && m.length <= 14
  })
  const chosen = shuffle(eligible).slice(0, pairCount)
  const cards: MemCard[] = []
  for (const k of chosen) {
    const meaning = k.meanings[0]
    const meaningMn = mnIfDifferent(meaning, k.meaningsMn?.[0]) ?? undefined
    const reading = k.kunYomi[0] ?? k.onYomi[0] ?? undefined
    cards.push({
      uid: `${k.id}-k`,
      pairId: k.id,
      kind: 'kanji',
      display: k.character,
      meaning,
      meaningMn,
      reading,
    })
    cards.push({
      uid: `${k.id}-m`,
      pairId: k.id,
      kind: 'meaning',
      display: meaning,
      meaningMn,
      reading,
    })
  }
  return shuffle(cards)
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function MemoryPage() {
  const navigate = useNavigate()
  const [allKanji, setAllKanji] = useState<Kanji[]>([])
  const { settings, setSettings } = useProgressStore()
  const [pairCount, setPairCount] = useState<(typeof PAIR_COUNTS)[number]>(6)
  const [phase, setPhase] = useState<Phase>('setup')
  const [cards, setCards] = useState<MemCard[]>([])
  const [up, setUp] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [gone, setGone] = useState<Set<number>>(new Set())
  const [mismatch, setMismatch] = useState<number[] | null>(null)
  const [moves, setMoves] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const lockRef = useRef(false)

  useEffect(() => {
    loadKanji().then(setAllKanji)
  }, [])

  const pool = useMemo(
    () =>
      filterByCurriculum(allKanji, {
        system: settings.levelSystem,
        level: settings.activeLevel,
      }),
    [allKanji, settings.levelSystem, settings.activeLevel],
  )
  const available = useMemo(
    () => new Set(getAvailableLevels(allKanji, settings.levelSystem)),
    [allKanji, settings.levelSystem],
  )

  const eligibleCount = pool.filter(
    (k) => k.meanings[0] && k.meanings[0].length <= 14,
  ).length
  const canStart = eligibleCount >= pairCount

  // Tick timer
  useEffect(() => {
    if (phase !== 'play') return
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 100)
    return () => clearInterval(id)
  }, [phase, startedAt])

  // Win condition
  useEffect(() => {
    if (phase !== 'play') return
    if (cards.length > 0 && matched.size === cards.length) {
      setElapsed(Date.now() - startedAt)
      setPhase('done')
    }
  }, [matched, cards.length, phase, startedAt])

  const onSystem = (s: LevelSystemId) => {
    const first = LEVEL_SYSTEMS[s].levels.find((l) =>
      allKanji.some((k) => k.levels.includes(`${s}:${l.id}` as Kanji['levels'][number])),
    )
    setSettings({ levelSystem: s, activeLevel: first?.id ?? LEVEL_SYSTEMS[s].levels[0].id })
  }

  const start = useCallback(() => {
    const deck = buildDeck(pool, pairCount)
    if (deck.length === 0) return
    setCards(deck)
    setUp([])
    setMatched(new Set())
    setGone(new Set())
    setMismatch(null)
    setMoves(0)
    setStartedAt(Date.now())
    setElapsed(0)
    lockRef.current = false
    setPhase('play')
  }, [pool, pairCount])

  const onCardTap = (idx: number) => {
    if (lockRef.current) return
    if (matched.has(idx) || up.includes(idx)) return

    const next = [...up, idx]
    setUp(next)

    if (next.length === 2) {
      lockRef.current = true
      setMoves((m) => m + 1)
      const [a, b] = next
      const same = cards[a].pairId === cards[b].pairId
      if (same) {
        window.setTimeout(() => {
          setMatched((prev) => {
            const ns = new Set(prev)
            ns.add(a)
            ns.add(b)
            return ns
          })
          setUp([])
          lockRef.current = false
          // Fade matched cards out a moment later so the board declutters.
          window.setTimeout(() => {
            setGone((prev) => {
              const ns = new Set(prev)
              ns.add(a)
              ns.add(b)
              return ns
            })
          }, 1200)
        }, 320)
      } else {
        setMismatch(next)
        window.setTimeout(() => {
          setMismatch(null)
          setUp([])
          lockRef.current = false
        }, 850)
      }
    }
  }

  const stateOf = (idx: number): CardState => {
    if (gone.has(idx)) return 'gone'
    if (matched.has(idx)) return 'matched'
    if (up.includes(idx)) return 'up'
    return 'down'
  }

  // ─── Render ────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <div className="screen-inner fade-in">
        <div style={{ padding: '8px 0 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Memory match
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            Flip pairs of kanji and their meanings.
          </div>
        </div>

        <LevelSystemPicker system={settings.levelSystem} onChange={onSystem} />
        <div style={{ height: 10 }} />
        <LevelPills
          system={settings.levelSystem}
          level={settings.activeLevel}
          onChange={(lvl) => setSettings({ activeLevel: lvl })}
          available={available}
        />

        <div
          className="card card-pad"
          style={{ marginTop: 24, position: 'relative', overflow: 'hidden' }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -30,
              bottom: -50,
              opacity: 0.05,
              fontFamily: 'var(--font-jp)',
              fontSize: 220,
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: '-0.1em',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            合
          </div>
          <div className="label-up muted">Pairs</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {PAIR_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPairCount(n)}
                className={`level-pill ${pairCount === n ? 'active' : ''}`}
                style={{ flex: '0 0 auto' }}
              >
                {n} pairs
                <span
                  style={{
                    opacity: 0.6,
                    marginLeft: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                  }}
                >
                  {n * 2}
                </span>
              </button>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 14, lineHeight: 1.5 }}>
            Tap two cards. Match the kanji to its meaning. The fewer moves, the better.
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: 18 }}
            disabled={!canStart}
            onClick={start}
          >
            <Icon name="play" size={16} /> Start
          </button>
          {!canStart && (
            <div className="hint-block" style={{ marginTop: 12 }}>
              Need at least {pairCount} kanji with short meanings in this level (found{' '}
              {eligibleCount}).
            </div>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div
        className="screen-inner fade-in"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}
      >
        <div className="label-up muted">Complete</div>
        <div className="bignum jp" style={{ fontSize: 64, marginTop: 6 }}>
          {moves}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          moves · {formatTime(elapsed)}
        </div>

        <div className="stat-row" style={{ marginTop: 28, width: '100%' }}>
          <div className="cell">
            <span className="l">Pairs</span>
            <span className="v">{cards.length / 2}</span>
          </div>
          <div className="cell">
            <span className="l">Moves</span>
            <span className="v">{moves}</span>
          </div>
          <div className="cell">
            <span className="l">Time</span>
            <span className="v">{formatTime(elapsed)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 32, width: '100%' }}>
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={() => setPhase('setup')}
          >
            Back
          </button>
          <button type="button" className="btn btn-primary btn-block" onClick={start}>
            Play again
          </button>
        </div>
      </div>
    )
  }

  // play
  return (
    <div className="screen-inner fade-in" style={{ paddingTop: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '8px 10px' }}
          onClick={() => setPhase('setup')}
          aria-label="Quit"
        >
          <Icon name="x" size={16} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="label-up muted">Memory</div>
          <div
            className="muted"
            style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 2 }}
          >
            {matched.size / 2} / {cards.length / 2}
          </div>
        </div>
        <div
          className="muted"
          style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'right' }}
        >
          <div>{moves} moves</div>
          <div>{formatTime(elapsed)}</div>
        </div>
      </div>

      <div className="progress" style={{ marginBottom: 16 }}>
        <div
          style={{
            width: `${cards.length ? (matched.size / cards.length) * 100 : 0}%`,
          }}
        />
      </div>

      <div className={`mem-grid${cards.length >= 16 ? ' cols-4' : ''}`}>
        {cards.map((c, idx) => {
          const state = stateOf(idx)
          const isMismatch = mismatch?.includes(idx) ?? false
          return (
            <button
              key={c.uid}
              type="button"
              className={`mem-cell ${isMismatch ? 'mismatch' : ''}`}
              data-state={state}
              onClick={() => onCardTap(idx)}
              aria-label={
                state === 'down'
                  ? 'Hidden card'
                  : c.kind === 'kanji'
                    ? `Kanji ${c.display}`
                    : `Meaning ${c.display}`
              }
            >
              <div className="kc-flip">
                <div className="kc-face mem-front">
                  <Icon name="flip" size={26} stroke={1.6} />
                </div>
                <div className="kc-face mem-back">
                  {c.kind === 'kanji' ? (
                    <span className="mem-kanji">{c.display}</span>
                  ) : (
                    <>
                      {settings.showFurigana && c.reading && (
                        <span
                          className="mem-meaning jp"
                          style={{ fontSize: 12, fontWeight: 500, opacity: 0.7 }}
                        >
                          {c.reading}
                        </span>
                      )}
                      <span className="mem-meaning">{c.display}</span>
                      {settings.showMongolian && c.meaningMn && (
                        <span
                          className="mem-meaning"
                          style={{ fontSize: 11, fontWeight: 500, opacity: 0.65 }}
                        >
                          {c.meaningMn}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/game')}>
          Quit
        </button>
      </div>
    </div>
  )
}
