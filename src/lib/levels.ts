import type {
  CurriculumRef,
  JlptLevel,
  Kanji,
  KanjiLevelTag,
  KankenLevel,
  LevelSystemId,
  SchoolGrade,
} from '@/types'

export type LevelDefinition = {
  id: string
  label: string
  shortLabel: string
  badgeVariant: string
}

export type LevelSystemConfig = {
  id: LevelSystemId
  label: string
  levels: LevelDefinition[]
}

export const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export const SCHOOL_GRADES: SchoolGrade[] = [
  'elem-1',
  'elem-2',
  'elem-3',
  'elem-4',
  'elem-5',
  'elem-6',
  'sec-1',
]

export const KANKEN_LEVELS: KankenLevel[] = ['10', '9', '8', '7', '6', '5', '4', '3', 'pre-2', '2', 'pre-1', '1']

export const LEVEL_SYSTEMS: Record<LevelSystemId, LevelSystemConfig> = {
  jlpt: {
    id: 'jlpt',
    label: 'JLPT',
    levels: JLPT_LEVELS.map((id) => ({
      id,
      label: id,
      shortLabel: id,
      badgeVariant: id.toLowerCase(),
    })),
  },
  school: {
    id: 'school',
    label: 'School',
    levels: [
      { id: 'elem-1', label: 'Elementary 1', shortLabel: '小1', badgeVariant: 'n5' },
      { id: 'elem-2', label: 'Elementary 2', shortLabel: '小2', badgeVariant: 'n4' },
      { id: 'elem-3', label: 'Elementary 3', shortLabel: '小3', badgeVariant: 'n4' },
      { id: 'elem-4', label: 'Elementary 4', shortLabel: '小4', badgeVariant: 'n3' },
      { id: 'elem-5', label: 'Elementary 5', shortLabel: '小5', badgeVariant: 'n2' },
      { id: 'elem-6', label: 'Elementary 6', shortLabel: '小6', badgeVariant: 'n2' },
      { id: 'sec-1', label: 'Secondary 1', shortLabel: '中学', badgeVariant: 'n1' },
    ],
  },
  kanken: {
    id: 'kanken',
    label: 'Kanken',
    levels: [
      { id: '10',    label: 'Level 10',   shortLabel: '10級',  badgeVariant: 'n5' },
      { id: '9',     label: 'Level 9',    shortLabel: '9級',   badgeVariant: 'n5' },
      { id: '8',     label: 'Level 8',    shortLabel: '8級',   badgeVariant: 'n4' },
      { id: '7',     label: 'Level 7',    shortLabel: '7級',   badgeVariant: 'n4' },
      { id: '6',     label: 'Level 6',    shortLabel: '6級',   badgeVariant: 'n3' },
      { id: '5',     label: 'Level 5',    shortLabel: '5級',   badgeVariant: 'n3' },
      { id: '4',     label: 'Level 4',    shortLabel: '4級',   badgeVariant: 'n2' },
      { id: '3',     label: 'Level 3',    shortLabel: '3級',   badgeVariant: 'n2' },
      { id: 'pre-2', label: 'Pre-Level 2', shortLabel: '儇2級', badgeVariant: 'n1' },
      { id: '2',     label: 'Level 2',    shortLabel: '2級',   badgeVariant: 'n1' },
      { id: 'pre-1', label: 'Pre-Level 1', shortLabel: '儇1級', badgeVariant: 'n1' },
      { id: '1',     label: 'Level 1',    shortLabel: '1級',   badgeVariant: 'n1' },
    ],
  },
}

export function levelTag(system: LevelSystemId, level: string): KanjiLevelTag {
  return `${system}:${level}` as KanjiLevelTag
}

export function curriculumKey(ref: CurriculumRef): string {
  return `${ref.system}:${ref.level}`
}

export function parseCurriculumKey(key: string): CurriculumRef | null {
  const idx = key.indexOf(':')
  if (idx === -1) return null
  const system = key.slice(0, idx) as LevelSystemId
  const level = key.slice(idx + 1)
  if (system !== 'jlpt' && system !== 'school' && system !== 'kanken') return null
  return { system, level }
}

export function filterByCurriculum(kanji: Kanji[], ref: CurriculumRef): Kanji[] {
  const tag = levelTag(ref.system, ref.level)
  return kanji.filter((k) => k.levels.includes(tag))
}

export function getAvailableLevels(kanji: Kanji[], system: LevelSystemId): string[] {
  const config = LEVEL_SYSTEMS[system]
  return config.levels
    .map((l) => l.id)
    .filter((id) => kanji.some((k) => k.levels.includes(levelTag(system, id))))
}

export function getLevelLabel(system: LevelSystemId, level: string): string {
  const def = LEVEL_SYSTEMS[system].levels.find((l) => l.id === level)
  return def?.label ?? level
}

export function getLevelShortLabel(system: LevelSystemId, level: string): string {
  const def = LEVEL_SYSTEMS[system].levels.find((l) => l.id === level)
  return def?.shortLabel ?? level
}

export function kanjiHasLevel(k: Kanji, system: LevelSystemId, level: string): boolean {
  return k.levels.includes(levelTag(system, level))
}

/** Read jlpt from legacy JSON during load */
export function normalizeKanji(raw: Record<string, unknown>): Kanji {
  const levels = (raw.levels as KanjiLevelTag[] | undefined) ?? []
  if (levels.length === 0 && raw.jlpt) {
    levels.push(levelTag('jlpt', raw.jlpt as string))
  }

  const vocabulary: Kanji['vocabulary'] =
    ((raw.vocabulary as Kanji['vocabulary'] | undefined) ??
    (raw.examples as Kanji['vocabulary'] | undefined) ??
    [])
    .map((v) => ({
      word: v.word,
      reading: v.reading,
      meaning: v.meaning,
      ...(v.meaningMn ? { meaningMn: v.meaningMn } : {}),
    }))

  const sentences: Kanji['sentences'] =
    ((raw.sentences as Kanji['sentences']) ?? [])
    .map((s) => ({
      japanese: s.japanese,
      ...(s.reading ? { reading: s.reading } : {}),
      english: s.english,
      ...(s.mongolian ? { mongolian: s.mongolian } : {}),
    }))

  return {
    id: raw.id as string,
    character: raw.character as string,
    meanings: raw.meanings as string[],
    ...(raw.meaningsMn ? { meaningsMn: raw.meaningsMn as string[] } : {}),
    onYomi: raw.onYomi as string[],
    kunYomi: raw.kunYomi as string[],
    strokeCount: raw.strokeCount as number,
    radicals: raw.radicals as string[],
    levels,
    vocabulary,
    sentences,
  }
}
