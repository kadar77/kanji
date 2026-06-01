import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { loadKanji } from '@/lib/kanji'
import { buildMixedGameDeck } from '@/lib/questions'
import { calculateKahootPoints, KAHOOT_QUESTION_TIME_MS } from '@/lib/scoring'
import { useEffectiveDark, useProgressStore } from '@/lib/progress'
import type {
  CurriculumRef,
  GameAnswer,
  GameSession,
  LevelSystemId,
  Question,
} from '@/types'

export function GamePlayPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const settings = useProgressStore((s) => s.settings)
  const effectiveDark = useEffectiveDark()

  const curriculum: CurriculumRef = {
    system: (params.get('system') ?? 'jlpt') as LevelSystemId,
    level: params.get('level') ?? 'N5',
  }
  const count = Number(params.get('count') ?? 10)

  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(KAHOOT_QUESTION_TIME_MS)
  const [picked, setPicked] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answers, setAnswers] = useState<GameAnswer[]>([])
  const startTimeRef = useRef(Date.now())
  const advancingRef = useRef(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.setAttribute('data-jpfont', settings.jpFont)
    return () => {
      document.documentElement.setAttribute(
        'data-theme',
        effectiveDark ? 'dark' : 'light',
      )
    }
  }, [settings.jpFont, effectiveDark])

  useEffect(() => {
    loadKanji().then((all) => {
      const deck = buildMixedGameDeck(all, curriculum, count)
      if (deck.length === 0) navigate('/game')
      else setQuestions(deck)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculum.system, curriculum.level, count])

  const q = questions[index]

  useEffect(() => {
    if (!q || answered || advancingRef.current) return
    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const left = Math.max(0, KAHOOT_QUESTION_TIME_MS - elapsed)
      setTimeLeft(left)
      if (left <= 0 && !advancingRef.current) handleAnswer(null, 0)
    }, 50)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, q?.id, answered])

  const finishGame = (
    finalAnswers: GameAnswer[],
    finalScore: number,
    finalCorrect: number,
  ) => {
    const session: GameSession = {
      curriculum,
      totalScore: finalScore,
      correctCount: finalCorrect,
      totalQuestions: questions.length,
      avgTimeMs: Math.round(
        finalAnswers.reduce((sum, x) => sum + x.timeMs, 0) /
          Math.max(1, finalAnswers.length),
      ),
      answers: finalAnswers,
    }
    navigate('/game/results', { state: session })
  }

  const handleAnswer = (choice: number | null, timeLeftMs: number) => {
    if (!q || advancingRef.current || answered) return
    advancingRef.current = true
    setAnswered(true)
    if (choice !== null) setPicked(choice)

    const correct = choice === q.correctIndex
    const timeMs = KAHOOT_QUESTION_TIME_MS - timeLeftMs
    const points = calculateKahootPoints(correct, timeLeftMs, KAHOOT_QUESTION_TIME_MS)
    const entry: GameAnswer = { questionId: q.id, correct, points, timeMs }
    const newAnswers = [...answers, entry]
    const newScore = totalScore + points
    const newCorrect = correctCount + (correct ? 1 : 0)

    setAnswers(newAnswers)
    setTotalScore(newScore)
    if (correct) setCorrectCount(newCorrect)

    setTimeout(() => {
      advancingRef.current = false
      if (index >= questions.length - 1) {
        finishGame(newAnswers, newScore, newCorrect)
      } else {
        setIndex((i) => i + 1)
        setPicked(null)
        setAnswered(false)
        setTimeLeft(KAHOOT_QUESTION_TIME_MS)
      }
    }, 1200)
  }

  if (!q) {
    return (
      <div className="game-stage" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="muted">Loading…</div>
      </div>
    )
  }

  const timePct = (timeLeft / KAHOOT_QUESTION_TIME_MS) * 100
  const ringSize = 64
  const r = (ringSize - 6) / 2
  const c = 2 * Math.PI * r
  const offset = c - (timePct / 100) * c
  const isRecognition = q.type === 'recognition' || q.type === 'reading-reverse'

  return (
    <div className="game-stage">
      <button
        type="button"
        className="iconbtn"
        style={{
          position: 'absolute',
          top: 24,
          left: 18,
          color: 'oklch(0.75 0 0)',
        }}
        onClick={() => navigate('/game')}
        aria-label="Quit game"
      >
        <Icon name="x" size={18} />
      </button>
      <div className="score-pill">
        <span style={{ opacity: 0.6 }}>Score</span>{' '}
        <span style={{ fontWeight: 600, marginLeft: 6 }}>
          {totalScore.toLocaleString()}
        </span>
      </div>

      <div style={{ marginTop: 46, textAlign: 'center' }}>
        <div className="label-up" style={{ color: 'oklch(0.6 0 0)' }}>
          Q {index + 1} / {questions.length}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize}>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              stroke="oklch(0.25 0.005 65)"
              strokeWidth={5}
              fill="none"
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              stroke={timePct < 25 ? 'oklch(0.7 0.18 25)' : 'oklch(0.75 0.12 75)'}
              strokeWidth={5}
              fill="none"
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {Math.ceil(timeLeft / 1000)}
          </div>
        </div>
      </div>

      <div className={isRecognition ? '' : 'qkanji jp'} style={isRecognition ? { fontSize: 24, textAlign: 'center', margin: '24px 0' } : undefined}>
        {q.prompt}
      </div>
      {q.promptSub && !isRecognition && (
        <div
          style={{
            textAlign: 'center',
            marginTop: -16,
            marginBottom: 24,
            opacity: 0.6,
            fontSize: 13,
          }}
        >
          {q.promptSub}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((txt, idx) => {
          const correct = picked !== null && idx === q.correctIndex && answered
          const wrong = picked === idx && idx !== q.correctIndex
          const optFuri =
            settings.showFurigana && q.type === 'meaning'
              ? (q.optionsFurigana?.[idx] ?? null)
              : null
          return (
            <button
              key={idx}
              type="button"
              className={`opt ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
              onClick={() => handleAnswer(idx, timeLeft)}
              disabled={answered}
              style={{ padding: '16px 16px', alignItems: optFuri ? 'flex-start' : undefined }}
            >
              <span className="key">{String.fromCharCode(65 + idx)}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                {optFuri && (
                  <span className="jp" style={{ fontSize: 13, opacity: 0.6, fontWeight: 500 }}>
                    {optFuri}
                  </span>
                )}
                <span
                  className={isRecognition ? 'jp' : ''}
                  style={{ fontSize: isRecognition ? 22 : 15, fontWeight: 500 }}
                >
                  {txt}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
