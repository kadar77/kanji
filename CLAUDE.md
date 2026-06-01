# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A solo-learner web app for studying Japanese kanji across three independent level systems: **JLPT** (N5–N1), **Japanese school grades** (小1–中1), and **Kanken** (漢検 10級–1級). Client-only React/Vite SPA — no backend, no account. All user progress lives in `localStorage` via a versioned Zustand store.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run preview      # preview built dist/

# Data pipeline (run in this order; each step caches downloads in scripts/.cache/)
npm run seed         # KANJIDIC2 + kanji-data + Kanken CSV → public/data/*.json
npm run enrich       # JMdict + Tatoeba → fills vocabulary[] and sentences[]
npm run enrich -- --skip-tatoeba   # skip the ~25 MB sentences download
```

Mongolian translations (`meaningsMn` / `meaningMn` / `mongolian`) are not produced
by an npm script — see **Translation** below.

There is no test runner configured. Verify UI changes by running `npm run dev` and exercising the affected page.

## Architecture

### Curriculum abstraction (the central concept)

Every page that filters kanji speaks in terms of a `CurriculumRef = { system: LevelSystemId, level: string }`, not "JLPT level". The three level systems coexist on the same kanji set — each kanji carries a `levels: KanjiLevelTag[]` array of `"jlpt:N5"`, `"school:elem-3"`, `"kanken:5"`-style tags, and `filterByCurriculum` in `src/lib/levels.ts` is the single funnel that turns a curriculum + the full kanji list into the working pool. The active curriculum lives in `useProgressStore().settings` (`levelSystem` + `activeLevel`) and is read via the `useCurriculum()` hook.

When adding a page or feature that operates on a "level": take a `CurriculumRef`, not a JLPT string. The `filterByJlpt` / `JLPTLevel` exports are deprecated migration shims — do not call them from new code.

### State (`src/lib/progress.ts`)

Single Zustand store, persisted to `localStorage` under key `kanji-progress` with `version: 3` and a `migrate` function. **Bump the version and extend `migrate` whenever you change the shape of persisted state** — silent shape changes will corrupt existing users' progress. The store holds: `mastery` (per-kanji new/learning/known), `testHistory` (capped at 20), `kahootBests` (keyed by `curriculumKey(ref)` = `"system:level"`), `writingPracticed`, and `settings`.

### Kanji data loader (`src/lib/kanji.ts`)

`loadKanji()` fetches `/data/kanji.json` once, runs every record through `normalizeKanji` (which back-fills the `levels[]` array from a legacy top-level `jlpt` field), and caches the result in module scope. Routes don't pass kanji around — they call `loadKanji()` on mount.

### Question generation (`src/lib/questions.ts`)

Five `TestType`s: `meaning`, `reading`, `recognition`, `vocabulary`, `reading-reverse`. `generateQuestion` falls back type-by-type when the target kanji is missing required data (e.g. `vocabulary` → `meaning` when `k.vocabulary` is empty). Both the test and game decks cycle through all five types round-robin via `types[i % types.length]`. Distractors are drawn from the same filtered curriculum pool, not the full 2230-kanji set.

### Routing (`src/App.tsx`)

`react-router-dom` v7. The `/game/play` (legacy solo speed quiz) and `/game/hayaoshi` routes both live **outside** the shared `<Layout>` so the immersive games run without the chrome/nav; every other route is a child of `<Layout>`.

The Games hub (`/game`) now leads with **Hayaoshi (早押し)** — a real multiplayer speed quiz (`src/pages/HayaoshiPage.tsx`, plus `PlayerAvatar` + `Fireworks` components). It talks to the **`hayaoshi-server`** Cloudflare Worker + Durable Object backend (separate repo): `src/lib/hayaoshi-api.ts` (REST `createRoom`/`getRoomSummary`, base URL from `VITE_HAYAOSHI_API`, default `http://localhost:8787`), `src/lib/useHayaoshiRoom.ts` (the WebSocket hook — server-driven state + reconnect via a per-room token in `localStorage`), and `src/lib/hayaoshi-protocol.ts` (wire types mirroring the backend). `src/lib/hayaoshi.ts` keeps only client helpers: avatars/colors and `buildQuestions` (the host builds the deck and **uploads it at room creation** — the server keeps `correctIdx` private until reveal). The page is a phase machine: role → host-setup/join-code → profile → (POST /rooms or join WS) → lobby/waiting → server-driven play (3-2-1 countdown, 10s question, reveal, optional leaderboard) → podium + fireworks finale, Exit-only. All progression/timing/scoring is **server-authoritative** — the page renders purely from WS messages (no client bots/timers/scoring). Host can play (counts as a player) or run "screen mode" (display-only). The old `GameSetupPage`/`GamePlayPage`/`GameResultsPage` solo flow is left in place but no longer linked from the hub.

The Cards grid flashcards are **tap-to-flip** (no hover/long-press); the flipped back shows a bottom-right ⤢ expand button that opens `KanjiPopup`, a popover that scales out of the tapped cell's footprint. Flip state is lifted to `CardsPage` (one card flipped at a time).

The MN (Mongolian) toggle in the header gates all `meaningsMn` / `mongolian` rendering — keep new translation surfaces behind `settings.showMongolian`. UI strings (chrome labels, buttons, headings) live in `src/lib/i18n.ts` as an `{ en, mn }` map consumed via the `useT()` hook — add new UI copy there rather than inlining bilingual conditionals in components.

### Aliasing & UI

- `@/*` → `src/*` (vite + tsconfig)
- Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js`; design tokens in `src/index.css`)
- shadcn-style primitives in `src/components/ui/` (Radix + cva); `cn()` helper in `src/lib/utils.ts`
- Writing practice uses Hanzi Writer (`src/components/KanjiWriter.tsx`, types in `src/hanzi-writer.d.ts`)

### Data pipeline (`scripts/*.mjs`)

Two Node scripts mutate `public/data/kanji.json` in place. Run order matters: `seed` creates the file from KANJIDIC2 + kanji-data + Kanken CSV; `enrich` fills `vocabulary[]` and `sentences[]` from JMdict + Tatoeba. All downloads are cached in `scripts/.cache/` (gitignored). JLPT levels come from the `kanji-data` npm package (Jonathan Waller's list), not KANJIDIC2 — KANJIDIC2 cannot distinguish N2 from N3.

**Both scripts rebuild English content from scratch and would otherwise wipe every Mongolian field.** To prevent that, each calls `applyTranslationCache` (`scripts/lib-translations.mjs`) just before writing, which re-attaches translations from `scripts/translation-cache.json` keyed by exact English string. So re-running the pipeline preserves Mongolian for any unchanged English string; only genuinely new English strings end up untranslated until the next translation pass.

### Translation

Mongolian fields (`kanji.meaningsMn`, `vocabulary[].meaningMn`, `sentences[].mongolian`) were generated by an LLM, not a translation API — an earlier MyMemory-based step produced low-quality, half-translated output and has been removed. The durable source of truth is `scripts/translation-cache.json`, an `{ "<english>": "<mongolian>" }` map (~19.6k entries) keyed by exact English string; `seed`/`enrich` fold it back into `kanji.json` on every run (see Data pipeline above).

To (re)generate translations — e.g. after `seed`/`enrich` introduces new English strings the cache doesn't cover yet:

1. **Collect** every unique English string from `meanings[]` / `vocabulary[].meaning` / `sentences[].english` (skip those already in the cache), each paired with a representative Japanese context (the kanji char, `word【reading】`, or the Japanese sentence). Chunk into ~75-string JSON batches.
2. **Translate** each batch with Claude, fed *both* the English gloss and its Japanese context. Rules the model followed: use Japanese only to disambiguate; translate into natural Mongolian **Cyrillic**; preserve `;`/`,` multi-sense separators; keep genuine proper nouns / scientific binomials (e.g. *Solanum melongena*, iPhone) untranslated; dictionary-style glosses, no romaji or notes. (This was run as an in-session Claude Code multi-agent workflow — ~260 agents, one per batch.)
3. **Merge** the new `{ english: mongolian }` pairs into `scripts/translation-cache.json`, then re-run `seed`/`enrich` (or `applyTranslationCache`) to push them into `kanji.json`.

When a translation is missing the field is left English-only, and the UI hides any `*Mn` value equal to its English source via `mnIfDifferent` (`src/lib/mn.ts`), so partial coverage degrades gracefully. New translation surfaces in the UI must stay behind the `settings.showMongolian` toggle.

### Meaning order

`meanings[0]` is treated as the canonical/primary sense — it drives grid cells (`KanjiCell` shows the top two), quiz answers and prompts (`src/lib/questions.ts`), and the memory game (`src/pages/MemoryPage.tsx`). KANJIDIC2 does not order meanings by everyday commonness (e.g. it leads 円 with "circle", not "yen"), so the `meanings[]` arrays were hand-curated once via an LLM pass to put the most common sense first. `chooseMeanings` in `seed` preserves that curated order on re-runs whenever the set of meanings is unchanged, falling back to KANJIDIC2's order only when the meanings genuinely change. To re-curate, run the same kind of reorder pass (a permutation of the existing strings — never add/remove/edit a gloss) and re-align `meaningsMn` via `applyTranslationCache`.

## Deploy

Static build. `vercel.json` is a single-page rewrite to `index.html`; deploy `dist/` to any static host.
