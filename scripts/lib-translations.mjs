/**
 * Shared helper: re-apply Mongolian translations onto kanji records.
 *
 * `seed` and `enrich` rebuild the English content of public/data/kanji.json
 * from their upstream sources, which would otherwise drop every Mongolian
 * field (`meaningsMn` / `vocabulary[].meaningMn` / `sentences[].mongolian`).
 * Both scripts call this just before writing the file so translations survive
 * a pipeline re-run.
 *
 * translation-cache.json is the durable `{ "<english>": "<mongolian>" }` map
 * (see CLAUDE.md → Translation). Lookups are keyed by the exact English
 * string, so translations re-attach correctly even if order/IDs change. English
 * strings with no cached translation are left English-only (the UI hides any
 * `*Mn` equal to its English source via `mnIfDifferent`).
 */

import fs from 'fs'

export function applyTranslationCache(kanji, cachePath) {
  if (!fs.existsSync(cachePath)) {
    console.log(`  no translation cache at ${cachePath} — skipping Mongolian re-apply`)
    return { meanings: 0, vocab: 0, sentences: 0 }
  }

  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  let meanings = 0
  let vocab = 0
  let sentences = 0

  for (const k of kanji) {
    if (k.meanings?.length) {
      k.meaningsMn = k.meanings.map((en) => {
        const mn = cache[en]
        if (mn) meanings++
        return mn ?? en
      })
    }
    for (const v of k.vocabulary ?? []) {
      const mn = cache[v.meaning]
      if (mn) {
        v.meaningMn = mn
        vocab++
      }
    }
    for (const s of k.sentences ?? []) {
      const mn = cache[s.english]
      if (mn) {
        s.mongolian = mn
        sentences++
      }
    }
  }

  console.log(
    `  re-applied translations from cache: ${meanings} meanings, ${vocab} vocab, ${sentences} sentences`,
  )
  return { meanings, vocab, sentences }
}
