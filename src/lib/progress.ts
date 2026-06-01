import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CurriculumRef,
  GameSession,
  Kanji,
  MasteryLevel,
  TestResult,
  UserSettings,
} from '@/types'
import { curriculumKey, filterByCurriculum, parseCurriculumKey } from '@/lib/levels'

type ProgressState = {
  mastery: Record<string, MasteryLevel>
  testHistory: TestResult[]
  kahootBests: Record<string, number>
  writingPracticed: string[]
  /** Sorted ascending ISO date strings (YYYY-MM-DD) when the user did something. */
  activityDays: string[]
  settings: UserSettings
  setMastery: (kanjiId: string, level: MasteryLevel) => void
  cycleMastery: (kanjiId: string) => MasteryLevel
  setAllForLevel: (
    allKanji: Kanji[],
    curriculum: CurriculumRef,
    level: MasteryLevel,
  ) => void
  addTestResult: (result: TestResult) => void
  deleteTestResult: (id: string) => void
  clearTestHistory: () => void
  updateKahootBest: (curriculum: CurriculumRef, score: number) => void
  markWritingPracticed: (kanjiId: string) => void
  recordActivity: () => void
  setSettings: (partial: Partial<UserSettings>) => void
  getMastery: (kanjiId: string) => MasteryLevel
  getLevelProgress: (kanjiIds: string[]) => { known: number; learning: number; total: number }
}

function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const MASTERY_CYCLE: MasteryLevel[] = ['new', 'learning', 'known']

const defaultSettings: UserSettings = {
  levelSystem: 'jlpt',
  activeLevel: 'N5',
  showMongolian: false,
  theme: 'system',
  jpFont: 'serif',
  cardStyle: 'bordered',
  showFurigana: false,
  testQuestionCount: 20,
  includeKnownInTests: true,
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      mastery: {},
      testHistory: [],
      kahootBests: {},
      writingPracticed: [],
      activityDays: [],
      settings: defaultSettings,

      getMastery: (kanjiId) => get().mastery[kanjiId] ?? 'new',

      recordActivity: () =>
        set((s) => {
          const today = todayISO()
          if (s.activityDays[s.activityDays.length - 1] === today) return s
          // Insert today in ascending order; cap to 365 entries.
          const next = [...s.activityDays.filter((d) => d !== today), today].sort()
          return { activityDays: next.slice(-365) }
        }),

      setMastery: (kanjiId, level) => {
        set((s) => ({ mastery: { ...s.mastery, [kanjiId]: level } }))
        get().recordActivity()
      },

      cycleMastery: (kanjiId) => {
        const current = get().getMastery(kanjiId)
        const idx = MASTERY_CYCLE.indexOf(current)
        const next = MASTERY_CYCLE[(idx + 1) % MASTERY_CYCLE.length]
        get().setMastery(kanjiId, next)
        return next
      },

      setAllForLevel: (allKanji, curriculum, level) => {
        set((s) => {
          const pool = filterByCurriculum(allKanji, curriculum)
          const next = { ...s.mastery }
          for (const k of pool) {
            if (level === 'new') delete next[k.id]
            else next[k.id] = level
          }
          return { mastery: next }
        })
        get().recordActivity()
      },

      addTestResult: (result) => {
        set((s) => ({ testHistory: [result, ...s.testHistory] }))
        get().recordActivity()
      },

      deleteTestResult: (id) =>
        set((s) => ({ testHistory: s.testHistory.filter((t) => t.id !== id) })),

      clearTestHistory: () => set({ testHistory: [] }),

      updateKahootBest: (curriculum, score) => {
        set((s) => {
          const key = curriculumKey(curriculum)
          const prev = s.kahootBests[key] ?? 0
          if (score <= prev) return s
          return { kahootBests: { ...s.kahootBests, [key]: score } }
        })
        get().recordActivity()
      },

      markWritingPracticed: (kanjiId) => {
        set((s) => {
          if (s.writingPracticed.includes(kanjiId)) return s
          return { writingPracticed: [...s.writingPracticed, kanjiId] }
        })
        get().recordActivity()
      },

      setSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      getLevelProgress: (kanjiIds) => {
        const { mastery } = get()
        let known = 0
        let learning = 0
        for (const id of kanjiIds) {
          const m = mastery[id] ?? 'new'
          if (m === 'known') known++
          else if (m === 'learning') learning++
        }
        return { known, learning, total: kanjiIds.length }
      },
    }),
    {
      name: 'kanji-progress',
      version: 6,
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>
        if (!state || typeof state !== 'object') return persisted

        const migrated = { ...state } as Record<string, unknown>

        if (!migrated.settings) {
          migrated.settings = defaultSettings
        } else {
          migrated.settings = { ...defaultSettings, ...(migrated.settings as object) }
        }

        if (migrated.kahootBests && typeof migrated.kahootBests === 'object') {
          const bests = migrated.kahootBests as Record<string, number>
          const newBests: Record<string, number> = {}
          for (const [k, v] of Object.entries(bests)) {
            const parsed = parseCurriculumKey(k)
            newBests[parsed ? curriculumKey(parsed) : `jlpt:${k}`] = v
          }
          migrated.kahootBests = newBests
        }

        if (Array.isArray(migrated.testHistory)) {
          migrated.testHistory = (migrated.testHistory as Record<string, unknown>[]).map(
            (t) => {
              if (t.curriculum) return t
              return {
                ...t,
                curriculum: { system: 'jlpt', level: t.jlpt ?? 'N5' },
              }
            },
          )
        }

        if (!migrated.writingPracticed) migrated.writingPracticed = []
        if (!Array.isArray(migrated.activityDays)) migrated.activityDays = []
        delete migrated.user

        return migrated
      },
    },
  ),
)

export function recordGameSession(session: GameSession) {
  useProgressStore.getState().updateKahootBest(session.curriculum, session.totalScore)
}

export function useCurriculum(): CurriculumRef {
  const { settings } = useProgressStore()
  return { system: settings.levelSystem, level: settings.activeLevel }
}

/** Resolves theme preference to effective dark/light, listening to OS changes. */
export function useEffectiveDark(): boolean {
  const theme = useProgressStore((s) => s.settings.theme)
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (theme === 'dark') return true
  if (theme === 'light') return false
  return systemDark
}
