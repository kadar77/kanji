import type { Kanji } from '@/types'
import { filterByCurriculum, normalizeKanji } from '@/lib/levels'

export { JLPT_LEVELS, LEVEL_SYSTEMS, filterByCurriculum, getAvailableLevels } from '@/lib/levels'

let kanjiCache: Kanji[] | null = null

export async function loadKanji(): Promise<Kanji[]> {
  if (kanjiCache) return kanjiCache
  const res = await fetch('/data/kanji.json')
  const raw = (await res.json()) as Record<string, unknown>[]
  kanjiCache = raw.map(normalizeKanji)
  return kanjiCache
}

export function getKanjiById(kanji: Kanji[], id: string): Kanji | undefined {
  return kanji.find((k) => k.id === id)
}

export function formatReadings(k: Kanji): string {
  const on = k.onYomi.length ? `On: ${k.onYomi.join(', ')}` : ''
  const kun = k.kunYomi.length ? `Kun: ${k.kunYomi.join(', ')}` : ''
  return [on, kun].filter(Boolean).join(' · ')
}

/** @deprecated */
export function filterByJlpt(kanji: Kanji[], jlpt: string): Kanji[] {
  return filterByCurriculum(kanji, { system: 'jlpt', level: jlpt })
}
