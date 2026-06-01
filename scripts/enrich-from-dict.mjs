/**
 * Download JMdict + Tatoeba once (cached in scripts/.cache),
 * then fill vocabulary[] and sentences[] in public/data/kanji.json
 *
 * Usage: npm run enrich
 *        npm run enrich -- --skip-tatoeba
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { gunzipSync } from 'zlib'
import readline from 'readline'
import { XMLParser } from 'fast-xml-parser'
import { applyTranslationCache } from './lib-translations.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(__dirname, '.cache')
const KANJI_PATH = path.join(__dirname, '../public/data/kanji.json')
const TRANSLATION_CACHE_PATH = path.join(__dirname, 'translation-cache.json')

const JMDICT_URLS = [
  'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz',
  'http://www.edrdg.org/pub/Nihongo/JMdict_e.gz',
]
const JMDICT_CACHE = path.join(CACHE, 'JMdict_e.xml')
const TATOEBA_SENTENCES_URL = 'https://downloads.tatoeba.org/exports/sentences.csv'
const TATOEBA_LINKS_URL = 'https://downloads.tatoeba.org/exports/links.csv'
const TATOEBA_SENTENCES_CACHE = path.join(CACHE, 'sentences.csv')
const TATOEBA_LINKS_CACHE = path.join(CACHE, 'links.csv')

const SKIP_TATOEBA = process.argv.includes('--skip-tatoeba')
const MAX_VOCAB = 8
const MAX_SENTENCES = 2

const FREQ_SCORE = {
  ichi1: 100,
  ichi2: 95,
  news1: 90,
  news2: 85,
  spec1: 80,
  spec2: 75,
  gai1: 70,
  nf01: 65,
  nf02: 64,
  nf03: 63,
  nf04: 62,
  nf05: 61,
  nf06: 60,
  nf07: 59,
  nf08: 58,
  nf09: 57,
  nf10: 56,
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

async function download(urls, dest) {
  if (fs.existsSync(dest)) {
    console.log('  cached:', path.basename(dest))
    return
  }
  const list = Array.isArray(urls) ? urls : [urls]
  let lastErr
  for (const url of list) {
    try {
      console.log('  downloading:', url)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(dest, buf)
      console.log('  saved:', path.basename(dest), `(${(buf.length / 1e6).toFixed(1)} MB)`)
      return
    } catch (e) {
      lastErr = e
      console.warn('  failed:', e.message)
    }
  }
  throw lastErr ?? new Error('All download URLs failed')
}

async function ensureJmdictXml() {
  if (fs.existsSync(JMDICT_CACHE)) {
    console.log('  cached: JMdict_e.xml')
    return
  }
  const gzPath = path.join(CACHE, 'JMdict_e.gz')
  await download(JMDICT_URLS, gzPath)
  console.log('  decompressing JMdict…')
  fs.writeFileSync(JMDICT_CACHE, gunzipSync(fs.readFileSync(gzPath)))
  console.log('  wrote JMdict_e.xml')
}

function arr(x) {
  if (x == null) return []
  return Array.isArray(x) ? x : [x]
}

function entryScore(entry) {
  let score = 0
  for (const ke of arr(entry.k_ele)) {
    for (const tag of arr(ke.ke_pri)) {
      if (FREQ_SCORE[tag]) score = Math.max(score, FREQ_SCORE[tag])
    }
  }
  for (const re of arr(entry.r_ele)) {
    for (const tag of arr(re.re_pri)) {
      if (FREQ_SCORE[tag]) score = Math.max(score, FREQ_SCORE[tag])
    }
  }
  return score
}

function parseJmdict(xml) {
  const parser = new XMLParser({
    ignoreAttributes: true,
    isArray: (n) => ['entry', 'k_ele', 'r_ele', 'sense', 'gloss', 'misc', 'fld', 'ke_pri', 're_pri', 'ke_inf'].includes(n),
    processEntities: { maxExpandedLength: 10_000_000 },
  })
  const doc = parser.parse(xml)
  return arr(doc.JMdict?.entry)
}

function glossText(g) {
  if (typeof g === 'string') return g
  return g?.['#text'] ?? String(g ?? '')
}

function buildVocabularyIndex(entries, targetChars) {
  const index = new Map(targetChars.map((c) => [c, []]))

  for (const entry of entries) {
    const keElems = arr(entry.k_ele)
    const rebs = arr(entry.r_ele).map((r) => r.reb).filter(Boolean)
    if (keElems.length === 0) continue

    const glosses = arr(entry.sense).flatMap((s) => arr(s.gloss).map(glossText).filter(Boolean))
    const meaning = glosses.slice(0, 3).join('; ')
    if (!meaning) continue

    const score = entryScore(entry)

    for (const ke of keElems) {
      const word = ke.keb
      if (!word) continue
      // Skip ateji forms — kanji used purely phonetically, e.g. 亜米利加 (America)
      if (arr(ke.ke_inf).includes('ateji')) continue

      for (const char of targetChars) {
        if (!word.includes(char)) continue
        let wordScore = score
        if (word === char) wordScore -= 15
        else if (word.length >= 2 && word.length <= 6) wordScore += 12
        else if (word.length > 8) wordScore -= 5
        index.get(char).push({
          word,
          reading: rebs[0] ?? '',
          meaning,
          score: wordScore,
        })
      }
    }
  }

  for (const [char, list] of index) {
    const seen = new Set()
    const deduped = []
    list.sort((a, b) => b.score - a.score)
    for (const item of list) {
      if (seen.has(item.word)) continue
      seen.add(item.word)
      deduped.push({ word: item.word, reading: item.reading, meaning: item.meaning })
      if (deduped.length >= MAX_VOCAB) break
    }
    index.set(char, deduped)
  }

  return index
}

/** Tatoeba sentences.csv: id, lang, text */
function parseTatoebaSentenceLine(line) {
  const parts = line.split('\t')
  if (parts.length < 3) return null
  const id = parts[0]
  const lang = parts[1]
  const text = parts[2]?.trim()
  if (!id || !text) return null
  return { id, lang, text }
}

async function streamLines(filePath, onLine) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (line.trim()) await onLine(line)
  }
}

async function buildSentenceIndex(targetChars) {
  const buckets = new Map(targetChars.map((c) => [c, []]))

  console.log('  pass 1: Japanese sentences (streaming full corpus)…')
  await streamLines(TATOEBA_SENTENCES_CACHE, (line) => {
    const row = parseTatoebaSentenceLine(line)
    if (!row || row.lang !== 'jpn') return
    const { id, text } = row
    if (text.length < 8 || text.length > 72) return
    if (!/[\u3040-\u30ff\u4e00-\u9fff]/.test(text)) return

    for (const char of targetChars) {
      if (!text.includes(char)) continue
      const bucket = buckets.get(char)
      if (bucket.length >= 30) continue
      bucket.push({ id, text, len: text.length })
    }
  })

  for (const [char, bucket] of buckets) {
    bucket.sort((a, b) => Math.abs(a.len - 28) - Math.abs(b.len - 28))
    buckets.set(char, bucket.slice(0, 12))
  }

  const neededJpn = new Set()
  for (const bucket of buckets.values()) {
    for (const s of bucket) neededJpn.add(s.id)
  }

  console.log(`  ${neededJpn.size} candidate JP sentences, pass 2: links…`)
  const engByJpn = new Map()
  await streamLines(TATOEBA_LINKS_CACHE, (line) => {
    const parts = line.split('\t')
    if (parts.length < 2) return
    const a = parts[0]
    const b = parts[1]
    if (neededJpn.has(a) && !engByJpn.has(a)) engByJpn.set(a, b)
    else if (neededJpn.has(b) && !engByJpn.has(b)) engByJpn.set(b, a)
  })

  const engIds = new Set(engByJpn.values())
  console.log(`  ${engIds.size} linked EN ids, pass 3: English sentences…`)
  const engText = new Map()
  await streamLines(TATOEBA_SENTENCES_CACHE, (line) => {
    const row = parseTatoebaSentenceLine(line)
    if (!row || row.lang !== 'eng' || !engIds.has(row.id)) return
    engText.set(row.id, row.text)
  })

  const result = new Map()
  for (const char of targetChars) {
    const sentences = []
    for (const { id, text } of buckets.get(char) ?? []) {
      const engId = engByJpn.get(id)
      const english = engId ? engText.get(engId) : null
      if (!english || english.length > 120) continue
      sentences.push({ japanese: text, english })
      if (sentences.length >= MAX_SENTENCES) break
    }
    result.set(char, sentences)
  }

  return result
}

async function main() {
  ensureDir(CACHE)
  const kanji = JSON.parse(fs.readFileSync(KANJI_PATH, 'utf8'))
  const targetChars = [...new Set(kanji.map((k) => k.character))]
  console.log(`Enriching ${kanji.length} kanji…\nJMdict:`)

  await ensureJmdictXml()
  console.log('  parsing XML (30–60s)…')
  const entries = parseJmdict(fs.readFileSync(JMDICT_CACHE, 'utf8'))
  console.log(`  ${entries.length} entries indexed`)

  const vocabIndex = buildVocabularyIndex(entries, targetChars)

  let sentenceIndex = new Map()
  if (!SKIP_TATOEBA) {
    console.log('\nTatoeba:')
    await download(TATOEBA_SENTENCES_URL, TATOEBA_SENTENCES_CACHE)
    await download(TATOEBA_LINKS_URL, TATOEBA_LINKS_CACHE)
    sentenceIndex = await buildSentenceIndex(targetChars)
  }

  let vocabFilled = 0
  let sentFilled = 0

  for (const k of kanji) {
    const vocab = vocabIndex.get(k.character) ?? []
    if (vocab.length) {
      k.vocabulary = vocab
      vocabFilled++
    }

    const sentences = sentenceIndex.get(k.character) ?? []
    if (sentences.length) {
      k.sentences = sentences
      sentFilled++
    }
  }

  // Re-attach Mongolian translations (enrich rebuilds vocab/sentences from scratch).
  applyTranslationCache(kanji, TRANSLATION_CACHE_PATH)

  fs.writeFileSync(KANJI_PATH, JSON.stringify(kanji, null, 2))
  console.log(
    `\nWrote ${KANJI_PATH}\nvocabulary: ${vocabFilled}/${kanji.length}, sentences: ${sentFilled}/${kanji.length}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
