import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { LevelChip } from '@/components/LevelChip'
import { loadKanji } from '@/lib/kanji'
import { mnIfDifferent } from '@/lib/mn'
import { buildQuestionDeck } from '@/lib/questions'
import { useProgressStore } from '@/lib/progress'
import type { AnswerRecord, CurriculumRef, LevelSystemId, Question } from '@/types'

export function TestRunPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const curriculum: CurriculumRef = {
    system: (params.get('system') ?? 'jlpt') as LevelSystemId,
    level: params.get('level') ?? 'N5',
  }
  const weakOnly = params.get('weak') === 'true'

  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const { getMastery, settings } = useProgressStore()

  useEffect(() => {
    loadKanji().then((all) => {
      const deck = buildQuestionDeck(
        all,
        curriculum,
        settings.testQuestionCount,
        weakOnly,
        getMastery,
      )
      if (deck.length === 0) {
        navigate('/tests')
        return
      }
      setQuestions(deck)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculum.system, curriculum.level, weakOnly, settings.testQuestionCount])

  const q = questions[index]

  if (!q) {
    return (
      <div className="screen-inner fade-in" style={{ paddingTop: 8 }}>
        <div className="skel skel-line" style={{ height: 4, margin: '14px 0 32px' }} />
        <div
          style={{
            margin: '0 auto 32px',
            width: 132,
            height: 132,
            borderRadius: 'var(--r-lg)',
          }}
          className="skel"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skel"
              style={{ height: 50, borderRadius: 'var(--r-md)' }}
            />
          ))}
        </div>
      </div>
    )
  }

  const isRecognition = q.type === 'recognition' || q.type === 'reading-reverse'
  const pct = ((index + (picked !== null ? 1 : 0)) / questions.length) * 100

  // MN hint — never on 'meaning' tests (would give the answer away),
  // and only when it differs from the English version.
  const enRef = q.type === 'recognition' ? q.prompt : q.promptSub
  const mnRef = q.promptSubMn ?? q.meaningsMn?.[0]
  const mnHint =
    settings.showMongolian && q.type !== 'meaning' ? mnIfDifferent(enRef, mnRef) : null

  const pick = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const next = [...answers, { question: q, selectedIndex: i }]
    setAnswers(next)
    setTimeout(() => {
      if (index < questions.length - 1) {
        setIndex((x) => x + 1)
        setPicked(null)
      } else {
        navigate('/tests/results', {
          state: { curriculum, weakOnly, answers: next },
        })
      }
    }, 1100)
  }

  const promptLabel =
    q.type === 'meaning'
      ? 'What does this mean?'
      : q.type === 'reading'
        ? 'How is it read?'
        : q.type === 'recognition'
          ? 'Which kanji means…'
          : q.type === 'vocabulary'
            ? 'Pick the vocabulary'
            : 'Which kanji is read…'

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
          onClick={() => navigate('/tests')}
          aria-label="Exit test"
        >
          <Icon name="x" size={16} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="label-up muted">{q.type}</div>
          <div
            className="muted"
            style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 2 }}
          >
            {index + 1} / {questions.length}
          </div>
        </div>
        <LevelChip system={curriculum.system} level={curriculum.level} />
      </div>

      <div className="progress" style={{ marginBottom: 32 }}>
        <div style={{ width: `${pct}%` }} />
      </div>

      <div style={{ textAlign: 'center', padding: '12px 0 28px' }}>
        <div className="label-up muted" style={{ marginBottom: 18 }}>
          {promptLabel}
        </div>
        {isRecognition ? (
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>{q.prompt}</div>
        ) : (
          <div className="jp" style={{ fontSize: 96, lineHeight: 1, fontWeight: 500 }}>
            {q.prompt}
          </div>
        )}
        {q.promptSub && (
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {q.promptSub}
          </div>
        )}
        {mnHint && (
          <div
            className="muted"
            style={{
              fontSize: 12,
              marginTop: q.promptSub ? 2 : 6,
              fontStyle: 'italic',
              opacity: 0.85,
            }}
          >
            {mnHint}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((txt, idx) => {
          const picked_this = picked === idx
          const optMn =
            settings.showMongolian && q.type === 'meaning'
              ? mnIfDifferent(txt, q.optionsMn?.[idx] ?? undefined)
              : null
          const optFuri =
            settings.showFurigana && q.type === 'meaning'
              ? (q.optionsFurigana?.[idx] ?? null)
              : null
          const stacked = !!optMn || !!optFuri
          return (
            <button
              key={idx}
              type="button"
              className={`opt ${picked_this ? 'correct' : ''}`}
              onClick={() => pick(idx)}
              disabled={picked !== null}
              style={stacked ? { alignItems: 'flex-start' } : undefined}
            >
              <span className="key" style={stacked ? { marginTop: 2 } : undefined}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {optFuri && (
                  <span className="jp muted" style={{ fontSize: 14, fontWeight: 500 }}>
                    {optFuri}
                  </span>
                )}
                <span
                  className={isRecognition ? 'jp' : ''}
                  style={{
                    fontSize: isRecognition ? 26 : q.type === 'reading' ? 18 : 14,
                    fontWeight: 500,
                  }}
                >
                  {txt}
                </span>
                {optMn && (
                  <span
                    className="muted"
                    style={{ fontSize: 12, fontStyle: 'italic' }}
                  >
                    {optMn}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
