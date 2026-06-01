import type { CurriculumRef, Kanji, Question, TestType } from '@/types'
import { filterByCurriculum } from '@/lib/levels'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors<T>(pool: T[], correct: T, count: number, label: (t: T) => string): T[] {
  const filtered = pool.filter((item) => label(item) !== label(correct))
  return shuffle(filtered).slice(0, count)
}

function buildOptions(correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const opts = shuffle([correct, ...distractors.slice(0, 3)])
  return { options: opts, correctIndex: opts.indexOf(correct) }
}

/**
 * Like buildOptions, but accepts (en, mn) pairs so the per-option MN
 * translations follow the shuffled order. The correct option is identified
 * by the first pair (which must be the correct one).
 */
function buildPairedOptions(
  pairs: { en: string; mn: string | null; fu: string | null }[],
): {
  options: string[]
  optionsMn: (string | null)[]
  optionsFurigana: (string | null)[]
  correctIndex: number
} {
  const correctEn = pairs[0].en
  const shuffled = shuffle(pairs.slice(0, 4))
  return {
    options: shuffled.map((p) => p.en),
    optionsMn: shuffled.map((p) => p.mn),
    optionsFurigana: shuffled.map((p) => p.fu),
    correctIndex: shuffled.findIndex((p) => p.en === correctEn),
  }
}

function primaryMeaning(k: Kanji): string {
  return k.meanings[0]
}

function primaryReading(k: Kanji): string {
  return k.kunYomi[0] ?? k.onYomi[0] ?? ''
}

function formatReadingExplanation(k: Kanji): string {
  const parts: string[] = []
  if (k.onYomi.length) parts.push(`On: ${k.onYomi.join(', ')}`)
  if (k.kunYomi.length) parts.push(`Kun: ${k.kunYomi.join(', ')}`)
  return parts.join(' · ')
}

function vocabLabel(k: Kanji): string {
  const v = k.vocabulary[0]
  return v ? `${v.word}（${v.reading}）` : ''
}

export function generateQuestion(k: Kanji, pool: Kanji[], type: TestType): Question {
  const id = `${type}-${k.id}-${Date.now()}`
  const meaningsMn = k.meaningsMn && k.meaningsMn.length > 0 ? k.meaningsMn : undefined

  // Fallbacks for types that require data that may be missing
  if (type === 'vocabulary' && k.vocabulary.length === 0) type = 'meaning'
  if (type === 'reading-reverse' && k.kunYomi.length === 0 && k.onYomi.length === 0) type = 'recognition'

  if (type === 'meaning') {
    const distractorKanji = pickDistractors(pool, k, 3, primaryMeaning)
    const pairs = [k, ...distractorKanji].map((src) => ({
      en: primaryMeaning(src),
      mn: src.meaningsMn?.[0] ?? null,
      fu: primaryReading(src) || null,
    }))
    const { options, optionsMn, optionsFurigana, correctIndex } = buildPairedOptions(pairs)
    return {
      id,
      type,
      prompt: k.character,
      options,
      optionsMn,
      optionsFurigana,
      correctIndex,
      kanjiId: k.id,
      explanation: `${k.character}: ${k.meanings.join(', ')}`,
      meaningsMn,
    }
  }

  if (type === 'reading') {
    const correct = primaryReading(k)
    const distractors = pickDistractors(pool, k, 3, primaryReading).map(primaryReading)
    const { options, correctIndex } = buildOptions(correct, distractors)
    return {
      id,
      type,
      prompt: k.character,
      promptSub: k.meanings[0],
      promptSubMn: meaningsMn?.[0],
      options,
      correctIndex,
      kanjiId: k.id,
      explanation: `${k.character} — ${formatReadingExplanation(k)}`,
      meaningsMn,
    }
  }

  if (type === 'recognition') {
    const correct = k.character
    const distractors = pickDistractors(pool, k, 3, (x) => x.character).map((x) => x.character)
    const { options, correctIndex } = buildOptions(correct, distractors)
    return {
      id,
      type,
      prompt: primaryMeaning(k),
      promptSubMn: meaningsMn?.[0],
      options,
      correctIndex,
      kanjiId: k.id,
      explanation: `${k.character}: ${k.meanings.join(', ')}`,
      meaningsMn,
    }
  }

  if (type === 'vocabulary') {
    const correct = vocabLabel(k)
    const poolWithVocab = pool.filter((x) => x.id !== k.id && x.vocabulary.length > 0)
    const distractors = shuffle(poolWithVocab).slice(0, 3).map(vocabLabel)
    const { options, correctIndex } = buildOptions(correct, distractors)
    return {
      id,
      type,
      prompt: k.character,
      promptSub: k.meanings[0],
      options,
      correctIndex,
      kanjiId: k.id,
      explanation: `${k.character}: ${k.vocabulary[0].word}（${k.vocabulary[0].reading}）— ${k.vocabulary[0].meaning}`,
      meaningsMn,
    }
  }

  // reading-reverse: show reading, pick kanji
  const reading = primaryReading(k)
  const correct = k.character
  const distractors = pickDistractors(pool, k, 3, (x) => x.character).map((x) => x.character)
  const { options, correctIndex } = buildOptions(correct, distractors)
  return {
    id,
    type: 'reading-reverse',
    prompt: reading,
    promptSub: k.meanings[0],
    promptSubMn: meaningsMn?.[0],
    options,
    correctIndex,
    kanjiId: k.id,
    explanation: `${reading} → ${k.character}: ${k.meanings.join(', ')}`,
    meaningsMn,
  }
}

export function buildQuestionDeck(
  allKanji: Kanji[],
  curriculum: CurriculumRef,
  count: number,
  weakOnly: boolean,
  getMastery: (id: string) => string,
): Question[] {
  let pool = filterByCurriculum(allKanji, curriculum)
  if (weakOnly) {
    pool = pool.filter((k) => getMastery(k.id) !== 'known')
  }
  if (pool.length < 4) return []

  const types: TestType[] = ['meaning', 'reading', 'recognition', 'vocabulary', 'reading-reverse']
  const selected = shuffle(pool).slice(0, Math.min(count, pool.length))
  return selected.map((k, i) => generateQuestion(k, pool, types[i % types.length]))
}

export function buildMixedGameDeck(
  allKanji: Kanji[],
  curriculum: CurriculumRef,
  count: number,
): Question[] {
  const pool = filterByCurriculum(allKanji, curriculum)
  if (pool.length < 4) return []

  const types: TestType[] = ['meaning', 'reading', 'recognition', 'vocabulary', 'reading-reverse']
  const selected = shuffle(pool).slice(0, Math.min(count, pool.length))
  return selected.map((k, i) => generateQuestion(k, pool, types[i % types.length]))
}
