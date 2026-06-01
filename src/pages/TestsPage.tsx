import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { LevelSystemPicker, LevelPills } from '@/components/LevelPicker'
import { Toggle } from '@/components/Toggle'
import { loadKanji } from '@/lib/kanji'
import { filterByCurriculum, getAvailableLevels, LEVEL_SYSTEMS } from '@/lib/levels'
import { useProgressStore } from '@/lib/progress'
import type { Kanji, LevelSystemId, TestResult } from '@/types'

export function TestsPage() {
  const navigate = useNavigate()
  const [kanji, setKanji] = useState<Kanji[]>([])
  const { settings, setSettings, testHistory, getMastery } = useProgressStore()

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

  const eligible = settings.includeKnownInTests
    ? pool
    : pool.filter((k) => getMastery(k.id) !== 'known')

  const onSystem = (s: LevelSystemId) => {
    const first = LEVEL_SYSTEMS[s].levels.find((l) =>
      kanji.some((k) => k.levels.includes(`${s}:${l.id}` as Kanji['levels'][number])),
    )
    setSettings({ levelSystem: s, activeLevel: first?.id ?? LEVEL_SYSTEMS[s].levels[0].id })
  }

  const startTest = () => {
    const params = new URLSearchParams({
      system: settings.levelSystem,
      level: settings.activeLevel,
      weak: String(!settings.includeKnownInTests),
    })
    navigate(`/tests/run?${params}`)
  }

  const recent = testHistory[0]
  const askedCount = Math.min(settings.testQuestionCount, eligible.length)
  const tooFew = eligible.length < 4

  return (
    <div className="screen-inner fade-in">
      <div style={{ padding: '8px 0 14px' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Tests</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Mixed quiz — meaning, reading, recognition, vocabulary &amp; more.
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
        style={{ marginTop: 18, position: 'relative', overflow: 'hidden' }}
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
          試
        </div>
        <div className="label-up muted">Mixed quiz</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
          <span className="bignum">{askedCount}</span>
          <span className="muted" style={{ fontSize: 13 }}>questions</span>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
          Questions cycle through all five test types. Change the default count in{' '}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              color: 'var(--ink)',
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Settings
          </button>
          .
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 18,
            padding: '12px 0',
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Include known kanji</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              Off → drill only the ones you haven&apos;t mastered yet.
            </div>
          </div>
          <Toggle
            value={settings.includeKnownInTests}
            onChange={(v) => setSettings({ includeKnownInTests: v })}
            label="Include known kanji"
          />
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 8 }}
          disabled={tooFew}
          onClick={startTest}
        >
          <Icon name="play" size={16} /> Start test
        </button>
      </div>

      {tooFew && (
        <div className="hint-block" style={{ marginTop: 14 }}>
          Need at least 4{' '}
          {settings.includeKnownInTests ? 'kanji in this level' : 'unmastered kanji'} to start.
        </div>
      )}

      {recent && (
        <>
          <h2>Recent results</h2>
          <ResultsHistory history={testHistory} />
        </>
      )}
    </div>
  )
}

function ResultsHistory({ history }: { history: TestResult[] }) {
  const [expanded, setExpanded] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<TestResult | null>(null)
  const navigate = useNavigate()
  const deleteTestResult = useProgressStore((s) => s.deleteTestResult)
  const [latest, ...older] = history
  const visible = expanded ? [latest, ...older] : [latest]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {visible.map((r, i) => (
        <ResultRow
          key={r.id}
          result={r}
          isLast={i === visible.length - 1 && !expanded}
          onOpen={() => navigate(`/tests/results?id=${r.id}`)}
          onDelete={() => setPendingDelete(r)}
        />
      ))}
      {pendingDelete && (
        <ConfirmSheet
          title="Delete this result?"
          body={`The score (${pendingDelete.score}/${pendingDelete.total}) and per-question review will be gone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            deleteTestResult(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {older.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'transparent',
            border: 0,
            borderTop: '1px solid var(--hairline)',
            cursor: 'pointer',
            color: 'var(--mute)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            font: 'inherit',
          }}
        >
          {expanded ? 'Show less' : `Show ${older.length} more`}
        </button>
      )}
    </div>
  )
}

function ResultRow({
  result,
  isLast,
  onOpen,
  onDelete,
}: {
  result: TestResult
  isLast: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0
  const date = new Date(result.completedAt)
  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      style={{
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        cursor: 'pointer',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Mixed · {result.curriculum.system}:{result.curriculum.level}
          {result.weakOnly && (
            <span
              className="muted"
              style={{ fontSize: 11, fontWeight: 500, marginLeft: 6 }}
            >
              (unmastered)
            </span>
          )}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {result.score} of {result.total} correct · {dateStr} · {timeStr}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="bignum-sm">{pct}</span>
          <span className="muted" style={{ fontSize: 11 }}>%</span>
        </div>
        <button
          type="button"
          className="iconbtn"
          style={{ width: 30, height: 30, marginLeft: 4 }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Delete result"
          title="Delete"
        >
          <Icon name="trash" size={15} stroke={1.7} />
        </button>
        <Icon name="right" size={14} stroke={2} />
      </div>
    </div>
  )
}

export function ConfirmSheet({
  title,
  body,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string
  body: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {title}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          {body}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-outline btn-block" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onConfirm}
            style={destructive ? { background: 'oklch(0.45 0.18 25)' } : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
