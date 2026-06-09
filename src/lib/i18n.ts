export const translations = {
  en: {
    // Nav
    nav: {
      home: 'Home',
      cards: 'Cards',
      tests: 'Tests',
      game: 'Game',
    },
    // Mastery levels
    mastery: {
      new: 'New',
      learning: 'Learning',
      known: 'Known',
    },
    // KanjiWriter
    writer: {
      watchStrokes: 'Watch strokes',
      practiceWriting: 'Practice writing',
      writingPracticed: 'Writing practiced',
      strokesUnavailable: 'Stroke data unavailable for this character.',
    },
    // FlashCard
    flashcard: {
      tapToFlip: 'Tap to flip',
      words: 'Words',
    },
    // VocabularyList
    vocabulary: {
      heading: 'Words using this kanji',
    },
    // SentencesList
    sentences: {
      heading: 'Example sentences',
    },
    // HomePage
    home: {
      title: 'Learn Kanji',
      subtitle: 'Master Japanese characters — JLPT or school grades (小1–中3).',
      known: 'known',
      gameBest: 'Game best',
      pts: 'pts',
      study: 'Study',
      noKanjiForLevel: 'No kanji for this level yet.',
      kanjiInApp: 'kanji in app',
      features: {
        cards: { title: 'Cards', desc: 'Flashcards by level' },
        tests: { title: 'Tests', desc: 'Practice quizzes' },
        game: { title: 'Game', desc: 'Timed Kahoot-style quiz' },
      },
    },
    // CardsPage
    cardsPage: {
      title: 'Kanji Cards',
      subtitle: 'Browse and study by level',
      emptyTitle: 'No kanji for this level',
      emptyDesc: 'Try another grade or JLPT level.',
      known: 'known',
      learning: 'learning',
      new: 'new',
      openDeck: 'Open flashcard deck',
    },
    // CardDetailPage
    cardDetail: {
      backToDeck: 'Back to deck',
      strokes: 'Strokes',
      tabs: {
        words: 'Words',
        sentences: 'Sentences',
        write: 'Write',
      },
      notFound: 'Kanji not found.',
    },
    // TestsPage
    testsPage: {
      title: 'Tests',
      subtitle: 'Mixed 10-question quiz — meaning, reading, recognition, vocabulary & more',
      testTypes: {
        meaning: { label: 'Meaning', desc: 'See kanji, pick the meaning' },
        reading: { label: 'Reading', desc: 'See kanji, pick the reading' },
        recognition: { label: 'Recognition', desc: 'See meaning, pick the kanji' },
        vocabulary: { label: 'Vocabulary', desc: 'See kanji, pick the vocabulary word' },
        'reading-reverse': { label: 'Reading→Kanji', desc: 'See reading, pick the kanji' },
      },
      weakOnly: 'Weak kanji only (not marked as known)',
      startTest: 'Start test (10 questions)',
      needMore: 'Need at least 4 kanji in pool',
    },
    // TestRunPage
    testRun: {
      loading: 'Loading test…',
      questionOf: (cur: number, total: number, score: number) =>
        `Question ${cur} of ${total} · Score: ${score}`,
      nextQuestion: 'Next question',
      finish: 'Finish',
    },
    // TestResultsPage
    testResults: {
      title: 'Test complete',
      resultLine: (score: number, total: number, sys: string, lvl: string) =>
        `${score} / ${total} correct · ${sys}:${lvl}`,
      toReview: (n: number) => `${n} kanji to review`,
      reviewSection: 'Question review',
      noResults: 'No results to show.',
      backToTests: 'Back to tests',
      newTest: 'New test',
      studyCards: 'Study cards',
    },
  },
} as const

export type Translations = typeof translations.en

export function useT(): Translations {
  return translations.en
}
