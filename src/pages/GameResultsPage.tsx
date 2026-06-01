import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { recordGameSession, useProgressStore } from '@/lib/progress'
import { curriculumKey } from '@/lib/levels'
import type { GameSession } from '@/types'

export function GameResultsPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const session = state as GameSession | null
  const key = session ? curriculumKey(session.curriculum) : ''
  const previousBest = useProgressStore((s) => (key ? s.kahootBests[key] : undefined))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (session && !saved) {
      recordGameSession(session)
      setSaved(true)
    }
  }, [session, saved])

  if (!session) {
    return (
      <div className="screen-inner">
        <div className="hint-block">No game results.</div>
        <Link to="/game" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
          Back
        </Link>
      </div>
    )
  }

  const accuracy = Math.round((session.correctCount / session.totalQuestions) * 100)
  const isNewBest = previousBest === undefined || session.totalScore > previousBest
  const pct = accuracy
  const verdict = pct >= 80 ? '🏆' : pct >= 60 ? '✨' : '📚'
  const verdictText = pct >= 80 ? 'New best!' : pct >= 60 ? 'Nice run' : 'Keep going'

  return (
    <div
      className="screen-inner fade-in"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}
    >
      <div className="label-up muted">Final score</div>
      <div className="bignum" style={{ fontSize: 64, marginTop: 6 }}>
        {session.totalScore.toLocaleString()}
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        {session.totalQuestions} questions · {accuracy}%
      </div>

      <div style={{ marginTop: 36, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }} aria-hidden>
          {verdict}
        </div>
        <div
          style={{ fontSize: 16, fontWeight: 600, marginTop: 8, letterSpacing: '-0.01em' }}
        >
          {isNewBest ? 'New personal best!' : verdictText}
        </div>
      </div>

      <div className="stat-row" style={{ marginTop: 28, width: '100%' }}>
        <div className="cell">
          <span className="l">Correct</span>
          <span className="v">
            {session.correctCount}/{session.totalQuestions}
          </span>
        </div>
        <div className="cell">
          <span className="l">Accuracy</span>
          <span className="v">{accuracy}%</span>
        </div>
        <div className="cell">
          <span className="l">Avg time</span>
          <span className="v">{(session.avgTimeMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 32, width: '100%' }}>
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={() => navigate('/game')}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() =>
            navigate(
              `/game/play?system=${session.curriculum.system}&level=${session.curriculum.level}&count=${session.totalQuestions}`,
            )
          }
        >
          Play again
        </button>
      </div>
    </div>
  )
}
