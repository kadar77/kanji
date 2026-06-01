import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { LevelChip } from '@/components/LevelChip'
import { MasteryButton } from '@/components/MasteryButton'
import { KanjiWriter } from '@/components/KanjiWriter'
import { StrokeProgression } from '@/components/StrokeProgression'
import { loadKanji, getKanjiById } from '@/lib/kanji'
import { mnIfDifferent, mnListIfDifferent } from '@/lib/mn'
import { useProgressStore } from '@/lib/progress'
import type { Kanji, LevelSystemId } from '@/types'

type Tab = 'words' | 'sentences' | 'write'

export function CardDetailPage() {
  const { id } = useParams<{ system: string; level: string; id: string }>()
  const navigate = useNavigate()
  const [kanji, setKanji] = useState<Kanji[]>([])
  const [tab, setTab] = useState<Tab>('words')
  const { getMastery, cycleMastery, settings } = useProgressStore()

  useEffect(() => {
    loadKanji().then(setKanji)
  }, [])

  const k = id ? getKanjiById(kanji, id) : undefined

  if (kanji.length && !k) {
    return (
      <div className="screen-inner">
        <div className="hint-block">Kanji not found.</div>
      </div>
    )
  }
  if (!k) return null

  const showMn = settings.showMongolian
  const meaningsMnVisible = showMn ? mnListIfDifferent(k.meanings, k.meaningsMn) : []

  return (
    <div className="screen-inner fade-in" style={{ paddingTop: 8 }}>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: '8px 10px', marginBottom: 4 }}
        onClick={() => navigate(-1)}
      >
        <Icon name="left" size={16} /> Back
      </button>

      <div
        className="card card-pad"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}
      >
        <div>
          <div className="hero-kanji jp">{k.character}</div>
          <div
            style={{
              marginTop: 14,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {k.meanings.join(', ')}
          </div>
          {meaningsMnVisible.length > 0 && (
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {meaningsMnVisible.join(', ')}
            </div>
          )}
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {k.strokeCount} strokes
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'flex-end',
          }}
        >
          {k.levels.map((tag) => {
            const [sys, lvl] = tag.split(':')
            return <LevelChip key={tag} system={sys as LevelSystemId} level={lvl} />
          })}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 10 }}>
        <div className="reading-block">
          {k.onYomi.length > 0 && (
            <div className="grp" style={{ flex: 1 }}>
              <span className="l">On'yomi</span>
              <span className="v">{k.onYomi.join('、')}</span>
            </div>
          )}
          {k.kunYomi.length > 0 && (
            <div className="grp" style={{ flex: 1 }}>
              <span className="l">Kun'yomi</span>
              <span className="v">{k.kunYomi.join('、')}</span>
            </div>
          )}
        </div>
        <div className="divider" />
        <MasteryButton level={getMastery(k.id)} onClick={() => cycleMastery(k.id)} />
      </div>

      <div className="tabs" style={{ marginTop: 16 }}>
        {(['words', 'sentences', 'write'] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {id === 'words' ? 'Words' : id === 'sentences' ? 'Sentences' : 'Write'}
          </button>
        ))}
      </div>

      {tab === 'words' && (
        <div className="vocab-list">
          {k.vocabulary.length === 0 && (
            <div className="vocab-row">
              <span className="muted">No vocabulary.</span>
            </div>
          )}
          {k.vocabulary.map((v, i) => (
            <div key={i} className="vocab-row">
              <div className="w">
                <span className="word jp">{v.word}</span>
                <span className="read jp">{v.reading}</span>
              </div>
              <span className="meaning">
                {v.meaning}
                {showMn && mnIfDifferent(v.meaning, v.meaningMn) ? (
                  <span className="muted" style={{ marginLeft: 8 }}>
                    · {v.meaningMn}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'sentences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {k.sentences.length === 0 ? (
            <div className="hint-block">No example sentences for this kanji.</div>
          ) : (
            k.sentences.map((s, i) => (
              <div key={i} className="sentence">
                <div className="jp-line">{s.japanese}</div>
                {s.reading && <div className="rd-line">{s.reading}</div>}
                <div className="en-line">{s.english}</div>
                {showMn && mnIfDifferent(s.english, s.mongolian) ? (
                  <div className="en-line muted" style={{ fontStyle: 'italic' }}>
                    {s.mongolian}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'write' && (
        <>
          <div className="card card-pad">
            <KanjiWriter character={k.character} kanjiId={k.id} />
          </div>
          <div className="card card-pad" style={{ marginTop: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span className="label-up muted">Stroke order</span>
              <span
                className="muted"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
              >
                {k.strokeCount} strokes
              </span>
            </div>
            <StrokeProgression character={k.character} />
          </div>
        </>
      )}
    </div>
  )
}
