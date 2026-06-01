# Kanji — Learn Japanese

A web app for studying Japanese kanji across three independent level systems:
**JLPT** (N5–N1), **Japanese school grades** (小1–小6, 中1), and **Kanken**
(漢検 10級–1級). Client-only React/Vite SPA — no account, no backend for the
core app; your progress lives in your browser.

🌐 **Live:** <https://kanji.kumogallery.com>

## Features

- **Cards** — flashcards with tap-to-flip + expandable detail, mastery tracking,
  vocabulary, and example sentences; searchable grid.
- **Tests** — a mixed quiz cycling five question types (meaning, reading,
  recognition, vocabulary, reading-reverse) with persistent results history.
- **Hayaoshi (早押し)** — a live **multiplayer** speed quiz: a host opens a room,
  players join by code or QR on their phones, with a 3-2-1 countdown, optional
  leaderboard between questions, and a podium + fireworks finale. Backed by a
  separate Cloudflare Worker — see
  [hayaoshi-server](https://github.com/kadar77/hayaoshi-server).
- **Memory match** — flip-to-pair kanji with their meanings.
- **Writing** — stroke-order animation and draw-to-match quiz (Hanzi Writer).
- **Level systems** — switch between JLPT, school grades, and Kanken on any page.
- **Bilingual & accessibility** — optional **Mongolian** glosses and optional
  **furigana** hints throughout; light/dark/system themes; multiple kanji fonts.

Progress and settings are saved in your browser (`localStorage`). No account
required. See [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md).

## Development

```bash
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm run preview    # preview the built dist/
npm run lint
```

To run the multiplayer game end-to-end, also run the
[hayaoshi-server](https://github.com/kadar77/hayaoshi-server) locally and point
the SPA at it with `VITE_HAYAOSHI_API` (defaults to `http://localhost:8787`).

## Data pipeline

The kanji dataset is built in two cached steps (downloads land in
`scripts/.cache/`):

```bash
# 1. Seed structural data (strokes, readings, meanings, JLPT/school/Kanken levels)
npm run seed

# 2. Enrich with vocabulary (JMdict) and example sentences (Tatoeba)
npm run enrich
npm run enrich -- --skip-tatoeba   # skip the ~25 MB sentences download
```

### Data files

| File | Description |
|------|-------------|
| `public/data/kanji.json` | ~2230 kanji with readings, meanings, vocabulary, sentences, and level tags |
| `public/data/school-grades.json` | School grade → kanji string (小1–中1) |
| `public/data/kanken-grades.json` | Kanken level → kanji string (10級–1級) |

## Deploy

Static build — deploy `dist/` to any static host. SPA rewrites to
`index.html` are configured for Cloudflare Pages (`public/_redirects`) and
Vercel (`vercel.json`). Currently hosted on Cloudflare Pages.

```bash
npm run build
```

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Router v7,
Radix UI, Hanzi Writer.

## License & attribution

- **Source code:** [MIT](LICENSE).
- **Kanji data, fonts, and libraries:** the bundled dataset is derived from
  third-party dictionaries (KANJIDIC2, JMdict — **CC BY-SA 4.0**), the Tatoeba
  corpus (**CC BY**), and other sources, each under its own license. Full
  credits and terms are in [ATTRIBUTION.md](ATTRIBUTION.md). If you redistribute
  the data you must keep that attribution and share-alike.

Not affiliated with the JLPT, the 漢検 foundation, or any dictionary/font provider.
