import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { LevelSystemPicker, LevelPills } from '@/components/LevelPicker'
import { loadKanji } from '@/lib/kanji'
import { curriculumKey, filterByCurriculum, getAvailableLevels, LEVEL_SYSTEMS } from '@/lib/levels'
import { useProgressStore } from '@/lib/progress'
import type { Kanji, LevelSystemId } from '@/types'

const COUNTS = [10, 15, 20] as const

export function GameSetupPage() {
  const navigate = useNavigate()
  const [kanji, setKanji] = useState<Kanji[]>([])
  const [count, setCount] = useState<number>(10)
  const { settings, setSettings, kahootBests, testHistory } = useProgressStore()

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
  const best = kahootBests[curriculumKey({ system: settings.levelSystem, level: settings.activeLevel })]

  const onSystem = (s: LevelSystemId) => {
    const first = LEVEL_SYSTEMS[s].levels.find((l) =>
      kanji.some((k) => k.levels.includes(`${s}:${l.id}` as Kanji['levels'][number])),
    )
    setSettings({ levelSystem: s, activeLevel: first?.id ?? LEVEL_SYSTEMS[s].levels[0].id })
  }

  const start = () => {
    navigate(
      `/game/play?system=${settings.levelSystem}&level=${settings.activeLevel}&count=${count}`,
    )
  }

  const gamesPlayed = testHistory.length // approximation; no separate counter

  return (
    <div className="screen-inner fade-in">
      <div style={{ padding: '8px 0 14px' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Quick Game</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          The faster you answer, the more points.
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
        style={{ marginTop: 24, padding: '28px 22px', position: 'relative', overflow: 'hidden' }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -30,
            bottom: -50,
            opacity: 0.06,
            fontFamily: 'var(--font-jp)',
            fontSize: 240,
            lineHeight: 1,
            fontWeight: 500,
            letterSpacing: '-0.1em',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          速
        </div>
        <div className="label-up muted">Today&apos;s run</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
          <span className="bignum">{Math.min(pool.length, count)}</span>
          <span className="muted" style={{ fontSize: 13 }}>questions</span>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 14, lineHeight: 1.5 }}>
          Tap the correct meaning before time runs out.
          <br />
          Faster answers earn bonus points.
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`level-pill ${count === n ? 'active' : ''}`}
              style={{ flex: '0 0 auto' }}
            >
              {n} Q
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 22 }}
          disabled={pool.length < 4}
          onClick={start}
        >
          <Icon name="play" size={16} /> Start
        </button>
      </div>

      <h2>Best scores</h2>
      <div className="stat-row">
        <div className="cell">
          <span className="l">Best</span>
          <span className="v">{best ? best.toLocaleString() : '—'}</span>
        </div>
        <div className="cell">
          <span className="l">Level</span>
          <span className="v">{settings.activeLevel}</span>
        </div>
        <div className="cell">
          <span className="l">Pool</span>
          <span className="v">{pool.length}</span>
        </div>
      </div>

      {pool.length < 4 && (
        <div className="hint-block" style={{ marginTop: 14 }}>
          Need at least 4 kanji to start.
        </div>
      )}

      {gamesPlayed === 0 && <div style={{ height: 0 }} />}
    </div>
  )
}
