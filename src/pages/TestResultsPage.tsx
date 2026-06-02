import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ProgressRing } from '@/components/ProgressRing'
import { mnListIfDifferent } from '@/lib/mn'
import { useProgressStore } from '@/lib/progress'
import type { AnswerRecord, CurriculumRef, TestResult, TestType } from '@/types'

type ResultsState = {
  curriculum: CurriculumRef
  weakOnly: boolean
  answers: AnswerRecord[]
}

const TYPE_LABELS: Record<TestType, string> = {
  meaning: 'Meaning',
  reading: 'Reading',
  recognition: 'Recognition',
  vocabulary: 'Vocabulary',
  'reading-reverse': 'Reading → Kanji',
}

export function TestResultsPage() {
  const { state } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const addTestResult = useProgressStore((s) => s.addTestResult)
  const applyTestMastery = useProgressStore((s) => s.applyTestMastery)
  const settings = useProgressStore((s) => s.settings)
  const testHistory = useProgressStore((s) => s.testHistory)
  const savedRef = useRef(false)

  const liveState = state as ResultsState | null
  const historyId = params.get('id')

  // Resolve which result to render: a freshly-completed run (via nav state) or
  // a stored history entry (via ?id=).
  const data: ResultsState | null = useMemo(() => {
    if (liveState) return liveState
    if (historyId) {
      const stored = testHistory.find((t) => t.id === historyId)
      if (stored?.answers) {
        return {
          curriculum: stored.curriculum,
          weakOnly: stored.weakOnly,
          answers: stored.answers,
        }
      }
    }
    return null
  }, [liveState, historyId, testHistory])

  const score = data
    ? data.answers.filter((a) => a.selectedIndex === a.question.correctIndex).length
    : 0
  const total = data ? data.answers.length : 0
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const missedKanjiIds = useMemo(
    () =>
      data
        ? data.answers
            .filter((a) => a.selectedIndex !== a.question.correctIndex)
            .map((a) => a.question.kanjiId)
        : [],
    [data],
  )

  useEffect(() => {
    // Only save when arriving from a live test finish — never re-save when
    // reopening a stored result from history.
    if (!liveState || savedRef.current) return
    savedRef.current = true
    const result: TestResult = {
      id: `test-${Date.now()}`,
      curriculum: liveState.curriculum,
      score,
      total,
      weakOnly: liveState.weakOnly,
      completedAt: new Date().toISOString(),
      missedKanjiIds,
      answers: liveState.answers,
    }
    addTestResult(result)
    applyTestMastery(liveState.answers)
  }, [liveState, addTestResult, applyTestMastery, score, total, missedKanjiIds])

  const byType = useMemo(() => {
    if (!data) return [] as { type: TestType; correct: number; total: number }[]
    const map = new Map<TestType, { correct: number; total: number }>()
    for (const a of data.answers) {
      const row = map.get(a.question.type) ?? { correct: 0, total: 0 }
      row.total++
      if (a.selectedIndex === a.question.correctIndex) row.correct++
      map.set(a.question.type, row)
    }
    return Array.from(map.entries()).map(([type, v]) => ({ type, ...v }))
  }, [data])

  if (!data) {
    const stored = historyId ? testHistory.find((t) => t.id === historyId) : null
    return (
      <div className="screen-inner">
        <div className="hint-block">
          {stored
            ? 'This test was taken before per-question review was saved, so only the score is available.'
            : 'No results to show.'}
        </div>
        {stored && (
          <div
            className="card card-pad"
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {stored.curriculum.system}:{stored.curriculum.level}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {stored.score} of {stored.total} correct ·{' '}
                {new Date(stored.completedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bignum-sm">
              {Math.round((stored.score / stored.total) * 100)}%
            </div>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/tests')}
        >
          Back to tests
        </button>
      </div>
    )
  }

  const verdict = pct >= 80 ? 'お見事' : pct >= 60 ? 'いい感じ' : 'もう一度'
  const blurb =
    pct >= 80
      ? 'Great work — keep the rhythm.'
      : pct >= 60
        ? 'Solid — review the missed ones.'
        : 'Worth a second look.'

  return (
    <div
      className="screen-inner fade-in"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 32 }}
    >
      <ProgressRing value={pct} size={140} stroke={10} color="var(--accent)">
        <div className="bignum" style={{ fontSize: 36 }}>
          {score}
          <span className="muted" style={{ fontSize: 16 }}> / {total}</span>
        </div>
        <div
          className="muted"
          style={{
            fontSize: 11,
            marginTop: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {pct}% correct
        </div>
      </ProgressRing>

      <div style={{ marginTop: 36, textAlign: 'center' }}>
        <div className="jp" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {verdict}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 6, maxWidth: 240 }}>
          {blurb}
        </div>
      </div>

      {byType.length > 1 && (
        <div style={{ marginTop: 28, width: '100%' }}>
          <h2 style={{ marginTop: 0 }}>By type</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {byType.map((row, i) => {
              const p = row.total ? Math.round((row.correct / row.total) * 100) : 0
              return (
                <div
                  key={row.type}
                  style={{
                    padding: '12px 14px',
                    borderTop: i === 0 ? 0 : '1px solid var(--hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {TYPE_LABELS[row.type]}
                    </div>
                    <div className="progress" style={{ height: 3, marginTop: 6 }}>
                      <div
                        style={{
                          width: `${p}%`,
                          background: p >= 80 ? 'var(--lvl-n5)' : 'var(--ink)',
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--mute)',
                      flex: '0 0 auto',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ color: 'var(--ink)', fontWeight: 600 }}>
                      {row.correct}/{row.total}
                    </div>
                    <div>{p}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {missedKanjiIds.length > 0 && (
        <div style={{ marginTop: 24, width: '100%' }}>
          <h2>Review</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.answers.map((a, i) => {
              const isCorrect = a.selectedIndex === a.question.correctIndex
              const q = a.question
              return (
                <div
                  key={q.id}
                  className="card card-pad"
                  style={{
                    borderColor: isCorrect ? 'var(--known-mark)' : 'oklch(0.65 0.18 25)',
                    background: isCorrect ? 'var(--known-bg)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: isCorrect ? 'var(--known-mark)' : 'oklch(0.55 0.18 25)' }}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {i + 1}.
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {q.type === 'recognition' || q.type === 'vocabulary'
                        ? q.prompt
                        : null}
                    </span>
                    {(q.type === 'meaning' ||
                      q.type === 'reading' ||
                      q.type === 'reading-reverse') && (
                      <span className="jp" style={{ fontSize: 22, fontWeight: 500 }}>
                        {q.prompt}
                      </span>
                    )}
                  </div>
                  {!isCorrect && (
                    <div style={{ fontSize: 12, marginTop: 6, paddingLeft: 20 }}>
                      <div className="muted">
                        Your answer:{' '}
                        <span style={{ color: 'oklch(0.55 0.18 25)', fontWeight: 500 }}>
                          {a.selectedIndex !== null ? q.options[a.selectedIndex] : '—'}
                        </span>
                      </div>
                      <div className="muted">
                        Correct:{' '}
                        <span style={{ color: 'var(--known-mark)', fontWeight: 500 }}>
                          {q.options[q.correctIndex]}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="muted" style={{ fontSize: 11, marginTop: 6, paddingLeft: 20 }}>
                    {q.explanation}
                  </div>
                  {settings.showMongolian &&
                    (() => {
                      const mn = mnListIfDifferent(
                        a.question.type === 'recognition' ? [a.question.prompt] : undefined,
                        q.meaningsMn,
                      )
                      return mn.length > 0 ? (
                        <div
                          className="muted"
                          style={{
                            fontSize: 11,
                            marginTop: 2,
                            paddingLeft: 20,
                            fontStyle: 'italic',
                          }}
                        >
                          {mn.join(', ')}
                        </div>
                      ) : null
                    })()}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 32, width: '100%' }}>
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={() => navigate('/tests')}
        >
          Back
        </button>
        <Link
          to={`/cards/${data.curriculum.system}/${data.curriculum.level}`}
          className="btn btn-primary btn-block"
        >
          Study cards
        </Link>
      </div>
    </div>
  )
}
