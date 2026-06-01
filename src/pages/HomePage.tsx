import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'
import { ProgressRing } from '@/components/ProgressRing'
import { LevelChip } from '@/components/LevelChip'
import { LevelSystemPicker, LevelPills } from '@/components/LevelPicker'
import { loadKanji } from '@/lib/kanji'
import { filterByCurriculum, getAvailableLevels, LEVEL_SYSTEMS } from '@/lib/levels'
import { useProgressStore } from '@/lib/progress'
import { calcStreak, lastSevenDays } from '@/lib/streak'
import type { Kanji, LevelSystemId } from '@/types'

export function HomePage() {
  const [kanji, setKanji] = useState<Kanji[]>([])
  const { settings, setSettings, getLevelProgress } = useProgressStore()
  const mastery = useProgressStore((s) => s.mastery)
  const activityDays = useProgressStore((s) => s.activityDays)
  const navigate = useNavigate()

  const streak = useMemo(() => calcStreak(activityDays), [activityDays])
  const week = useMemo(() => lastSevenDays(activityDays), [activityDays])
  const activeThisWeek = week.filter((d) => d.active).length

  useEffect(() => {
    loadKanji().then(setKanji)
  }, [])

  const curriculum = useMemo(
    () => ({ system: settings.levelSystem, level: settings.activeLevel }),
    [settings.levelSystem, settings.activeLevel],
  )
  const pool = useMemo(() => filterByCurriculum(kanji, curriculum), [kanji, curriculum])
  const { known, learning, total } = getLevelProgress(pool.map((k) => k.id))
  const pct = total ? Math.round((known / total) * 100) : 0

  const continueKanji = useMemo(() => {
    return (
      pool.find((k) => (mastery[k.id] ?? 'new') === 'learning') ??
      pool.find((k) => (mastery[k.id] ?? 'new') !== 'known') ??
      pool[0]
    )
  }, [pool, mastery])

  const onSystem = (s: LevelSystemId) => {
    const first = LEVEL_SYSTEMS[s].levels.find((l) =>
      kanji.some((k) => k.levels.includes(`${s}:${l.id}` as Kanji['levels'][number])),
    )
    setSettings({ levelSystem: s, activeLevel: first?.id ?? LEVEL_SYSTEMS[s].levels[0].id })
  }

  const available = new Set(getAvailableLevels(kanji, settings.levelSystem))

  const features: { id: string; to: string; label: string; desc: string; icon: IconName }[] = [
    { id: 'cards', to: '/cards', label: 'Flashcards', desc: 'Study with mastery tracking', icon: 'layers' },
    { id: 'tests', to: '/tests', label: 'Tests', desc: 'Meaning, reading & recognition', icon: 'cap' },
    { id: 'game', to: '/game', label: 'Games', desc: 'Speed quiz · memory match', icon: 'zap' },
  ]

  const dayLabel = new Intl.DateTimeFormat('ja-JP', { weekday: 'long' }).format(new Date())

  return (
    <div className="screen-inner fade-in">
      <div style={{ padding: '8px 0 4px' }}>
        <div className="label-up muted">Today · {dayLabel}</div>
        <div style={{ marginTop: 6 }}>
          <div className="jp" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>ただいま。</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            Welcome back. Pick up where you left.
          </div>
        </div>
      </div>

      <div
        className="card card-pad"
        style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 18 }}
      >
        <ProgressRing value={pct} color="var(--accent)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <LevelChip system={settings.levelSystem} level={settings.activeLevel} />
            <span className="faint" style={{ fontSize: 12 }}>·</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {known}/{total} known
            </span>
          </div>
          <div className="progress">
            <div style={{ width: `${pct}%` }} />
          </div>
          <div
            className="muted"
            style={{ fontSize: 11, marginTop: 8, display: 'flex', gap: 12 }}
          >
            <span>{learning} learning</span>
            <span>·</span>
            <span>{Math.max(0, total - known - learning)} new</span>
          </div>
        </div>
      </div>

      <h2>Studying</h2>
      <LevelSystemPicker system={settings.levelSystem} onChange={onSystem} />
      <div style={{ height: 10 }} />
      <LevelPills
        system={settings.levelSystem}
        level={settings.activeLevel}
        onChange={(lvl) => setSettings({ activeLevel: lvl })}
        available={available}
      />

      {continueKanji && (
        <>
          <div className="section-head" style={{ marginTop: 24 }}>
            <h2 style={{ margin: 0 }}>Continue</h2>
          </div>
          <button
            type="button"
            className="continue-card"
            onClick={() =>
              navigate(
                `/cards/${settings.levelSystem}/${settings.activeLevel}/${continueKanji.id}`,
              )
            }
          >
            <div className="lhs">
              <div className="label-up">Next up</div>
              <div className="ti">{continueKanji.meanings.slice(0, 2).join(', ')}</div>
              <div className="meta jp">
                {[...continueKanji.onYomi, ...continueKanji.kunYomi].slice(0, 3).join('・')}
              </div>
            </div>
            <div className="rhs jp">{continueKanji.character}</div>
          </button>
        </>
      )}

      <h2>Practice</h2>
      <div className="row-list">
        {features.map((f) => (
          <button key={f.id} type="button" onClick={() => navigate(f.to)}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-2)',
                border: '1px solid var(--border)',
                flex: '0 0 auto',
              }}
            >
              <Icon name={f.icon} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{f.desc}</div>
            </div>
            <Icon name="right" size={16} stroke={2} />
          </button>
        ))}
      </div>

      <h2>This week</h2>
      <div className="card card-pad">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className={streak > 0 ? 'pulse-soft' : ''}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background:
                  streak > 0
                    ? 'color-mix(in oklch, var(--accent) 18%, transparent)'
                    : 'var(--surface-2)',
                color: streak > 0 ? 'var(--accent)' : 'var(--faint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: streak > 0 ? 0 : '1px solid var(--border)',
              }}
            >
              <Icon name="flame" size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {streak === 0
                  ? 'No streak yet'
                  : `${streak}-day streak`}
              </div>
              <div className="muted" style={{ fontSize: 11 }}>
                {activeThisWeek === 0
                  ? 'Study something today to start one.'
                  : `${activeThisWeek} active day${activeThisWeek === 1 ? '' : 's'} this week`}
              </div>
            </div>
          </div>
          <div className="bignum-sm">{streak}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 48 }}>
          {week.map((d) => (
            <div
              key={d.iso}
              title={d.iso}
              aria-label={`${d.iso}: ${d.active ? 'active' : 'inactive'}`}
              style={{
                flex: 1,
                height: d.active ? '100%' : '14%',
                minHeight: 4,
                background: d.active
                  ? d.isToday
                    ? 'var(--accent)'
                    : 'color-mix(in oklch, var(--accent) 55%, var(--surface-2))'
                  : 'var(--surface-2)',
                border: d.active
                  ? '1px solid color-mix(in oklch, var(--accent) 35%, var(--border))'
                  : '1px solid var(--border)',
                borderRadius: 4,
                transition: 'height 0.5s var(--ease-out), background-color 0.3s var(--ease-out)',
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 9.5,
            color: 'var(--faint)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {week.map((d, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                color: d.isToday ? 'var(--ink-2)' : undefined,
                fontWeight: d.isToday ? 600 : undefined,
              }}
            >
              {d.letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
