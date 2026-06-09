export type LevelSystemId = 'jlpt' | 'school' | 'kanken'

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export type SchoolGrade =
  | 'elem-1'
  | 'elem-2'
  | 'elem-3'
  | 'elem-4'
  | 'elem-5'
  | 'elem-6'
  | 'sec-1'

export type KankenLevel = '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | 'pre-2' | '2' | 'pre-1' | '1'

export type KanjiLevelTag =
  | `jlpt:${JlptLevel}`
  | `school:${SchoolGrade}`
  | `kanken:${KankenLevel}`

/** @deprecated Use JlptLevel — kept for gradual migration */
export type JLPTLevel = JlptLevel

export type CurriculumRef = {
  system: LevelSystemId
  level: string
}

export type MasteryLevel = 'new' | 'learning' | 'known'
export type LearningStage = 1 | 2 | 3

export type VocabularyWord = {
  word: string
  reading: string
  meaning: string
  meaningMn?: string
}

export type ExampleSentence = {
  japanese: string
  reading?: string
  english: string
  mongolian?: string
}

export type Kanji = {
  id: string
  character: string
  meanings: string[]
  meaningsMn?: string[]
  onYomi: string[]
  kunYomi: string[]
  strokeCount: number
  radicals: string[]
  levels: KanjiLevelTag[]
  vocabulary: VocabularyWord[]
  sentences: ExampleSentence[]
}

export type TestType = 'meaning' | 'reading' | 'recognition' | 'vocabulary' | 'reading-reverse'

export type Question = {
  id: string
  type: TestType
  prompt: string
  promptSub?: string
  promptSubMn?: string
  options: string[]
  /** Same length as options. Null entries when no MN equivalent exists. */
  optionsMn?: (string | null)[]
  /**
   * Same length as options. The kana reading of the kanji each meaning option
   * refers to — shown as an optional furigana hint so learners who don't read
   * English/Mongolian can still identify the answer. Meaning questions only.
   */
  optionsFurigana?: (string | null)[]
  /**
   * Same length as options. A secondary line under each option — used by the
   * vocabulary test to show the word's English meaning beneath its reading.
   */
  optionsSub?: (string | null)[]
  correctIndex: number
  kanjiId: string
  explanation: string
  meaningsMn?: string[]
}

export type AnswerRecord = {
  question: Question
  selectedIndex: number | null
}

export type TestResult = {
  id: string
  curriculum: CurriculumRef
  testType?: TestType
  score: number
  total: number
  weakOnly: boolean
  completedAt: string
  missedKanjiIds: string[]
  /** Per-question answers, persisted so the review can be reopened later. */
  answers?: AnswerRecord[]
}

export type ThemePref = 'light' | 'dark' | 'system'
export type JpFont = 'serif' | 'sans' | 'brush'
export type CardStyle = 'flat' | 'bordered' | 'shadowed'

export type UserSettings = {
  levelSystem: LevelSystemId
  activeLevel: string
  showMongolian: boolean
  theme: ThemePref
  jpFont: JpFont
  cardStyle: CardStyle
  showFurigana: boolean
  testQuestionCount: number
  includeKnownInTests: boolean
}
