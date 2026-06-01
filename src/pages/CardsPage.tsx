import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { SearchBar } from '@/components/SearchBar'
import { LevelSystemPicker, LevelPills } from '@/components/LevelPicker'
import { KanjiCell } from '@/components/KanjiCell'
import { KanjiPopup } from '@/components/KanjiPopup'
import { loadKanji } from '@/lib/kanji'
import { filterByCurriculum, getAvailableLevels, LEVEL_SYSTEMS } from '@/lib/levels'
import { useProgressStore } from '@/lib/progress'
import type { Kanji, LevelSystemId, MasteryLevel } from '@/types'

type Filter = 'all' | 'new' | 'learning' | 'known'

export function CardsPage() {
  const navigate = useNavigate()
  const [kanji, setKanji] = useState<Kanji[]>([])
  const { settings, setSettings, getMastery } = useProgressStore()
  const cycleMastery = useProgressStore((s) => s.cycleMastery)
  const masteryState = useProgressStore((s) => s.mastery)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  // Tap a card to flip it (one at a time); tap the flipped card's expand
  // button to open the detail popover that grows out of the card.
  const [flippedId, setFlippedId] = useState<string | null>(null)
  const [popup, setPopup] = useState<Kanji | null>(null)
  const closePopup = () => {
    setPopup(null)
    setFlippedId(null)
  }

  useEffect(() => {
    loadKanji().then(setKanji)
  }, [])

  const pool = useMemo(
    () =>
      filterByCurriculum(kanji, {
        system: settings.levelSystem,
        level: settings.activeLevel,
      }),
    [kanji, settings.levelSystem, settings.activeLevel],
  )

  const available = useMemo(
    () => new Set(getAvailableLevels(kanji, settings.levelSystem)),
    [kanji, settings.levelSystem],
  )

  const filtered = useMemo(() => {
    let list = pool
    if (filter !== 'all') list = list.filter((k) => (masteryState[k.id] ?? 'new') === filter)
    const q = query.toLowerCase().trim()
    if (q) {
      list = list.filter(
        (k) =>
          k.character.includes(q) ||
          k.meanings.some((m) => m.toLowerCase().includes(q)) ||
          k.onYomi.some((r) => r.toLowerCase().includes(q)) ||
          k.kunYomi.some((r) => r.toLowerCase().includes(q)) ||
          k.vocabulary.some(
            (v) =>
              v.word.includes(q) ||
              v.reading.includes(q) ||
              v.meaning.toLowerCase().includes(q),
          ),
      )
    }
    return list
  }, [pool, filter, query, masteryState])

  const known = pool.filter((k) => (masteryState[k.id] ?? 'new') === 'known').length
  const learning = pool.filter((k) => (masteryState[k.id] ?? 'new') === 'learning').length

  const onSystem = (s: LevelSystemId) => {
    const first = LEVEL_SYSTEMS[s].levels.find((l) =>
      kanji.some((k) => k.levels.includes(`${s}:${l.id}` as Kanji['levels'][number])),
    )
    setSettings({ levelSystem: s, activeLevel: first?.id ?? LEVEL_SYSTEMS[s].levels[0].id })
  }

  const filterCounts: [Filter, string, number][] = [
    ['all', 'All', pool.length],
    ['new', 'New', Math.max(0, pool.length - known - learning)],
    ['learning', 'Learning', learning],
    ['known', 'Known', known],
  ]

  return (
    <div className="screen-inner fade-in">
      <div style={{ padding: '8px 0 12px' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Cards</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          {pool.length} kanji · {known} known · {learning} learning
        </div>
      </div>

      <SearchBar value={query} onChange={setQuery} />

      <div style={{ marginTop: 14 }}>
        <LevelSystemPicker system={settings.levelSystem} onChange={onSystem} />
      </div>
      <div style={{ marginTop: 10 }}>
        <LevelPills
          system={settings.levelSystem}
          level={settings.activeLevel}
          onChange={(lvl) => setSettings({ activeLevel: lvl })}
          available={available}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          marginTop: 14,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {filterCounts.map(([id, lbl, n]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`level-pill ${filter === id ? 'active' : ''}`}
            style={{ flex: '0 0 auto' }}
          >
            {lbl}{' '}
            <span
              style={{
                opacity: 0.55,
                marginLeft: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
            >
              {n}
            </span>
          </button>
        ))}
      </div>

      {pool.length > 0 && (
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 18 }}
          onClick={() =>
            navigate(`/cards/${settings.levelSystem}/${settings.activeLevel}`)
          }
        >
          <Icon name="play" size={16} />
          Study {filtered.length} {filtered.length === pool.length ? '' : 'filtered '}cards
        </button>
      )}

      <div
        className="section-head"
        style={{ marginTop: 24, marginBottom: 8, alignItems: 'baseline' }}
      >
        <h2 style={{ margin: 0 }}>Kanji</h2>
        <span className="faint" style={{ fontSize: 11 }}>
          Tap to flip · ⤢ for details
        </span>
      </div>
      {kanji.length === 0 ? (
        <div className="kanji-grid" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skel skel-cell" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="hint-block">No kanji match — try a different search or filter.</div>
      ) : (
        <div className="kanji-grid">
          {filtered.map((k) => (
            <KanjiCell
              key={k.id}
              kanji={k}
              mastery={(getMastery(k.id) ?? 'new') as MasteryLevel}
              showFurigana={settings.showFurigana}
              showMongolian={settings.showMongolian}
              flipped={flippedId === k.id}
              onTap={() => setFlippedId((id) => (id === k.id ? null : k.id))}
              onExpand={() => setPopup(k)}
            />
          ))}
        </div>
      )}

      {popup && (
        <KanjiPopup
          kanji={popup}
          mastery={(getMastery(popup.id) ?? 'new') as MasteryLevel}
          showMongolian={settings.showMongolian}
          onCycleMastery={() => cycleMastery(popup.id)}
          onClose={closePopup}
          onOpen={() => {
            const id = popup.id
            closePopup()
            navigate(`/cards/${settings.levelSystem}/${settings.activeLevel}/${id}`)
          }}
        />
      )}
    </div>
  )
}
