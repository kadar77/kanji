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
    // Options are kanji; carry each one's reading so furigana can annotate them
    // (the reading doesn't reveal which kanji matches the meaning prompt).
    const distractorKanji = pickDistractors(pool, k, 3, (x) => x.character)
    const all = shuffle([k, ...distractorKanji])
    return {
      id,
      type,
      prompt: primaryMeaning(k),
      promptSubMn: meaningsMn?.[0],
      options: all.map((x) => x.character),
      optionsFurigana: all.map((x) => primaryReading(x) || null),
      correctIndex: all.findIndex((x) => x.id === k.id),
      kanjiId: k.id,
      explanation: `${k.character}: ${k.meanings.join(', ')}`,
      meaningsMn,
    }
  }

  if (type === 'vocabulary') {
    // Prompt is the word (in kanji); each option shows the reading (kana) +
    // meaning. The word's own reading/meaning aren't in the prompt, so the
    // kanji can't give the answer away.
    const correct = k.vocabulary[0]
    const distractors = shuffle(pool.filter((x) => x.id !== k.id && x.vocabulary.length > 0))
      .map((x) => x.vocabulary[0])
      .filter((v) => v.reading !== correct.reading && v.meaning !== correct.meaning)
      .slice(0, 3)
    const all = shuffle([correct, ...distractors])
    return {
      id,
      type,
      prompt: correct.word,
      options: all.map((v) => v.reading),
      optionsSub: all.map((v) => v.meaning),
      optionsMn: all.map((v) => v.meaningMn ?? null),
      correctIndex: all.findIndex((v) => v === correct),
      kanjiId: k.id,
      explanation: `${correct.word}（${correct.reading}）— ${correct.meaning}`,
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
  /** 'mixed' cycles all five types round-robin; otherwise every question uses
   *  the given type (with generateQuestion's per-kanji fallbacks). */
  type: TestType | 'mixed' = 'mixed',
): Question[] {
  let pool = filterByCurriculum(allKanji, curriculum)
  if (weakOnly) {
    pool = pool.filter((k) => getMastery(k.id) !== 'known')
  }
  if (pool.length < 4) return []

  const types: TestType[] = ['meaning', 'reading', 'recognition', 'vocabulary', 'reading-reverse']
  const selected = shuffle(pool).slice(0, Math.min(count, pool.length))
  return selected.map((k, i) =>
    generateQuestion(k, pool, type === 'mixed' ? types[i % types.length] : type),
  )
}

