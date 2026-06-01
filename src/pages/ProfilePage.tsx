import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { LevelChip } from '@/components/LevelChip'
import { LevelSystemPicker } from '@/components/LevelPicker'
import { Toggle } from '@/components/Toggle'
import { ConfirmSheet } from '@/pages/TestsPage'
import { loadKanji } from '@/lib/kanji'
import { filterByCurriculum, LEVEL_SYSTEMS } from '@/lib/levels'
import { useProgressStore } from '@/lib/progress'
import { calcStreak } from '@/lib/streak'
import type { Kanji, LevelSystemId, MasteryLevel, ThemePref } from '@/types'

type SheetState = { level: string; action: 'reset' | 'mark-known' | 'mark-learning' } | null

export function ProfilePage() {
  const navigate = useNavigate()
  const {
    settings,
    setSettings,
    mastery,
    setAllForLevel,
    testHistory,
    clearTestHistory,
  } = useProgressStore()
  const [allKanji, setAllKanji] = useState<Kanji[]>([])
  const [system, setSystem] = useState<LevelSystemId>(settings.levelSystem)
  const [sheet, setSheet] = useState<SheetState>(null)
  const [clearOpen, setClearOpen] = useState(false)

  useEffect(() => {
    loadKanji().then(setAllKanji)
  }, [])

  const cfg = LEVEL_SYSTEMS[system]

  const summary = useMemo(() => {
    return cfg.levels
      .map((lvl) => {
        const pool = filterByCurriculum(allKanji, { system, level: lvl.id })
        let known = 0
        let learning = 0
        for (const k of pool) {
          const m = mastery[k.id] ?? 'new'
          if (m === 'known') known++
          else if (m === 'learning') learning++
        }
        return { lvl: lvl.id, total: pool.length, known, learning }
      })
      .filter((x) => x.total > 0)
  }, [cfg, allKanji, mastery, system])

  const totalKnown = Object.values(mastery).filter((v) => v === 'known').length
  const totalLearning = Object.values(mastery).filter((v) => v === 'learning').length
  const activityDays = useProgressStore((s) => s.activityDays)
  const streak = useMemo(() => calcStreak(activityDays), [activityDays])

  const performAction = () => {
    if (!sheet) return
    const ref = { system, level: sheet.level }
    const map: Record<typeof sheet.action, MasteryLevel> = {
      reset: 'new',
      'mark-known': 'known',
      'mark-learning': 'learning',
    }
    setAllForLevel(allKanji, ref, map[sheet.action])
    setSheet(null)
  }

  return (
    <div className="screen-inner fade-in" style={{ paddingTop: 8, position: 'relative' }}>
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
          onClick={() => navigate(-1)}
        >
          <Icon name="left" size={16} /> Back
        </button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Settings</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="stat-row">
        <div className="cell">
          <span className="l">Known</span>
          <span className="v">{totalKnown}</span>
        </div>
        <div className="cell">
          <span className="l">Learning</span>
          <span className="v">{totalLearning}</span>
        </div>
        <div className="cell">
          <span className="l">Streak</span>
          <span className="v">{streak}</span>
        </div>
      </div>

      <h2>Appearance</h2>
      <div className="card card-pad">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Theme</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Match the system, or pick a side.
            </div>
          </div>
        </div>
        <div className="segmented full">
          {(['light', 'system', 'dark'] as ThemePref[]).map((id) => (
            <button
              key={id}
              type="button"
              className={settings.theme === id ? 'active' : ''}
              onClick={() => setSettings({ theme: id })}
            >
              {id === 'light' ? 'Light' : id === 'system' ? 'System' : 'Dark'}
            </button>
          ))}
        </div>
      </div>

      <h2>Language</h2>
      <div
        className="card card-pad"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Show Mongolian translations</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Add Монгол next to English on cards, words, and sentences.
          </div>
        </div>
        <Toggle
          value={settings.showMongolian}
          onChange={(v) => setSettings({ showMongolian: v })}
          label="Show Mongolian"
        />
      </div>

      <h2>Grid</h2>
      <div
        className="card card-pad"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Show furigana</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Reading hints under each kanji — in the grid and on test questions.
          </div>
        </div>
        <Toggle
          value={settings.showFurigana}
          onChange={(v) => setSettings({ showFurigana: v })}
          label="Show furigana"
        />
      </div>

      <h2>Tests</h2>
      <div className="card card-pad">
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Questions per test</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Used for every mixed-type quiz.
          </div>
        </div>
        <div className="segmented full">
          {[10, 20, 30, 40, 50].map((n) => (
            <button
              key={n}
              type="button"
              className={settings.testQuestionCount === n ? 'active' : ''}
              onClick={() => setSettings({ testQuestionCount: n })}
            >
              {n}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Include known kanji</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Off → drill only the ones you haven&apos;t mastered yet.
            </div>
          </div>
          <Toggle
            value={settings.includeKnownInTests}
            onChange={(v) => setSettings({ includeKnownInTests: v })}
            label="Include known kanji in tests"
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Test history</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {testHistory.length === 0
                ? 'No tests taken yet.'
                : `${testHistory.length} result${testHistory.length === 1 ? '' : 's'} saved on this device.`}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={testHistory.length === 0}
            onClick={() => setClearOpen(true)}
            style={{
              padding: '7px 12px',
              fontSize: 12,
              color: testHistory.length === 0 ? 'var(--faint)' : 'oklch(0.55 0.18 25)',
              flex: '0 0 auto',
            }}
          >
            <Icon name="trash" size={13} /> Clear all
          </button>
        </div>
      </div>

      <h2>Manage progress</h2>
      <div style={{ marginBottom: 12 }}>
        <LevelSystemPicker system={system} onChange={setSystem} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {summary.map((row, i) => (
          <ProgressRow
            key={row.lvl}
            system={system}
            level={row.lvl}
            total={row.total}
            known={row.known}
            learning={row.learning}
            isLast={i === summary.length - 1}
            onReset={() => setSheet({ level: row.lvl, action: 'reset' })}
            onMarkKnown={() => setSheet({ level: row.lvl, action: 'mark-known' })}
            onMarkLearning={() => setSheet({ level: row.lvl, action: 'mark-learning' })}
          />
        ))}
        {summary.length === 0 && (
          <div className="card-pad muted" style={{ textAlign: 'center' }}>
            No kanji loaded for this system.
          </div>
        )}
      </div>

      <div
        className="muted"
        style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5, padding: '0 4px' }}
      >
        Tap a level to mark all of it as known (you already learned these), as learning (in
        progress), or reset to start fresh.
      </div>

      <h2 style={{ marginTop: 28 }}>About</h2>
      <div className="row-list">
        <Link to="/privacy">
          <span style={{ flex: 1, fontSize: 14 }}>Privacy Policy</span>
          <Icon name="right" size={16} stroke={2} />
        </Link>
        <Link to="/terms">
          <span style={{ flex: 1, fontSize: 14 }}>Terms of Use</span>
          <Icon name="right" size={16} stroke={2} />
        </Link>
        <a href="https://github.com/kadar77/kanji" target="_blank" rel="noreferrer">
          <span style={{ flex: 1, fontSize: 14 }}>Source &amp; attribution</span>
          <Icon name="right" size={16} stroke={2} />
        </a>
      </div>

      <div
        className="muted"
        style={{
          textAlign: 'center',
          marginTop: 18,
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
        }}
      >
        Kanji · v1.0.0
      </div>

      {sheet && (
        <ResetSheet
          system={system}
          level={sheet.level}
          action={sheet.action}
          onConfirm={performAction}
          onCancel={() => setSheet(null)}
        />
      )}

      {clearOpen && (
        <ConfirmSheet
          title="Clear all test history?"
          body={`All ${testHistory.length} saved results will be deleted, including their per-question reviews. This can't be undone.`}
          confirmLabel="Clear all"
          destructive
          onConfirm={() => {
            clearTestHistory()
            setClearOpen(false)
          }}
          onCancel={() => setClearOpen(false)}
        />
      )}
    </div>
  )
}

function ProgressRow({
  system,
  level,
  total,
  known,
  learning,
  isLast,
  onReset,
  onMarkKnown,
  onMarkLearning,
}: {
  system: LevelSystemId
  level: string
  total: number
  known: number
  learning: number
  isLast: boolean
  onReset: () => void
  onMarkKnown: () => void
  onMarkLearning: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pct = total ? Math.round((known / total) * 100) : 0
  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--hairline)' }}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
          color: 'inherit',
        }}
      >
        <LevelChip system={system} level={level} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="progress" style={{ height: 3 }}>
            <div
              style={{
                width: `${pct}%`,
                background: pct >= 100 ? 'var(--lvl-n5)' : 'var(--ink)',
              }}
            />
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 5, display: 'flex', gap: 8 }}>
            <span>{known} known</span>
            <span>·</span>
            <span>{learning} learning</span>
            <span>·</span>
            <span>{total} total</span>
          </div>
        </div>
        <span
          style={{
            color: 'var(--mute)',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(90deg)' : 'none',
          }}
        >
          <Icon name="right" size={14} />
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '2px 16px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '7px 12px', fontSize: 12 }}
            onClick={onMarkKnown}
          >
            <Icon name="check" size={13} /> Mark all known
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '7px 12px', fontSize: 12 }}
            onClick={onMarkLearning}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                border: '1.5px solid var(--learning-mark)',
              }}
            />
            Set as learning
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '7px 12px', fontSize: 12, color: 'oklch(0.55 0.18 25)' }}
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}

function ResetSheet({
  system,
  level,
  action,
  onConfirm,
  onCancel,
}: {
  system: LevelSystemId
  level: string
  action: 'reset' | 'mark-known' | 'mark-learning'
  onConfirm: () => void
  onCancel: () => void
}) {
  const cfg = LEVEL_SYSTEMS[system]
  const def = cfg.levels.find((l) => l.id === level)
  const lbl = def?.shortLabel ?? level
  const verb =
    action === 'mark-known'
      ? 'mark every kanji as known'
      : action === 'mark-learning'
        ? 'mark every kanji as learning'
        : 'reset all progress for'

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {action === 'reset' ? 'Reset progress?' : 'Set as known?'}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          This will {verb}{' '}
          <strong style={{ color: 'var(--ink)' }}>
            {cfg.label} {lbl}
          </strong>
          . This can&apos;t be undone.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-outline btn-block" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onConfirm}
            style={action === 'reset' ? { background: 'oklch(0.45 0.18 25)' } : undefined}
          >
            {action === 'reset' ? 'Reset' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
