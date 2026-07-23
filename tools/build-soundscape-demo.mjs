#!/usr/bin/env node
// Regenerates src/demos/soundscape-matt6.json from the REAL Soundscape engine
// cache (Ancient Sources Corpus, v9_MAT_6.9-6.13.json), adding per-verse
// ("lines") structure and per-word syllable counts. Do not hand-type Greek
// anywhere in this file: every surface form, gloss, and z-score is read
// straight out of the cache.
//
// Usage: node tools/build-soundscape-demo.mjs
//   Override the source cache location with the SOUNDSCAPE_CACHE env var; the
//   default below points at the maintainer's local Ancient Sources Corpus.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')

const CACHE_PATH =
  process.env.SOUNDSCAPE_CACHE ||
  path.join(
    os.homedir(),
    'Documents',
    'Ancient-Sources-Corpus',
    'Projects',
    'Ancient Sources Corpus',
    'scripts',
    'soundscape',
    '_cache',
    'v9_MAT_6.9-6.13.json',
  )

const DEMO_PATH = path.join(REPO_ROOT, 'src', 'demos', 'soundscape-matt6.json')
const BACKUP_PATH = `${DEMO_PATH}.bak`

// ---------------------------------------------------------------------------
// Load inputs
// ---------------------------------------------------------------------------

const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
const oldDemo = JSON.parse(fs.readFileSync(DEMO_PATH, 'utf8'))

// Preserve the pre-rebuild file exactly once. If a .bak already exists from a
// prior run, leave it alone so we never clobber the true original with a
// regenerated copy.
if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(DEMO_PATH, BACKUP_PATH)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sorted-copy equality check for a multiset of Greek surface forms. */
function sameWordMultiset(a, b) {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((w, i) => w === sb[i])
}

/** Standard-normal upper-tail probability via Abramowitz & Stegun 7.1.26. */
function normalUpperTail(z) {
  if (z <= 0) return 0.5
  const t = 1 / (1 + 0.2316419 * z)
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const poly =
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return d * poly
}

function derivedRarity(z) {
  const p = normalUpperTail(z)
  if (p <= 0) return null
  const n = Math.round(1 / p)
  if (n <= 1) return 'about even'
  return `≈ 1 in ${n}`
}

const refIndex = new Map() // cache ref -> index into cache.tokens
cache.tokens.forEach((t, i) => refIndex.set(t.ref, i))

function tokenByRef(ref) {
  return cache.tokens[refIndex.get(ref)]
}

// Reuse plain-language copy + rarity phrasing from the current (hand-tuned)
// demo file wherever the type + word-set matches, so wording choices already
// approved by Joshua survive the regeneration.
function findOldHit(type, words) {
  return oldDemo.hits.find((h) => h.type === type && sameWordMultiset(h.words, words))
}

const PLAIN_BY_TYPE = {
  alliteration: 'matching word-beginnings',
  onset_class_alliteration: 'matching word-beginnings (sound family)',
  paronomasia: 'play on similar-sounding words',
  homoioteleuton: 'matching word-endings (rhyme)',
}

// ---------------------------------------------------------------------------
// tokens[] — reading order, straight from the cache
// ---------------------------------------------------------------------------

const tokens = cache.tokens.map((t) => ({
  v: t.verse,
  s: t.surface,
  g: t.gloss,
  p: t.punct || '',
  syl: t.syllables.length,
}))

// ---------------------------------------------------------------------------
// lines[] — one per verse 9..13
// ---------------------------------------------------------------------------

const VERSES = [9, 10, 11, 12, 13]

const lines = VERSES.map((v) => {
  const tokenIdx = []
  tokens.forEach((tok, i) => {
    if (tok.v === v) tokenIdx.push(i)
  })
  const syllableCount = tokenIdx.reduce((sum, i) => sum + tokens[i].syl, 0)
  return {
    v,
    english: oldDemo.english[String(v)],
    tokenIdx,
    wordCount: tokenIdx.length,
    syllableCount,
  }
})

// ---------------------------------------------------------------------------
// hits[] — curated selection of the real detector output.
//
// This whitelist is the same set of findings Joshua already approved in the
// hand-tuned demo (matched back against the live cache below so every value
// is re-derived, not hand-typed), plus the one canonical finding the old
// file was missing: the -θήτω petition rhyme (homoioteleuton). The three
// CANONICAL findings referenced in the build brief are marked below.
// ---------------------------------------------------------------------------

const HIT_WHITELIST = [
  { type: 'alliteration', words: ['γενηθήτω', 'γῆς'] },
  { type: 'alliteration', words: ['οὐρανοῖς', 'οὐρανῷ'] },
  {
    type: 'onset_class_alliteration',
    words: ['ἄφες', 'ἡμῖν', 'ὀφειλήματα', 'ἡμῶν', 'ὡς', 'ἡμεῖς', 'ἀφήκαμεν', 'ὀφειλέταις', 'ἡμῶν'],
  },
  { type: 'onset_class_alliteration', words: ['σου', 'σου', 'σου'] },
  { type: 'alliteration', words: ['πειρασμόν', 'πονηροῦ'], canonical: true },
  { type: 'alliteration', words: ['προσεύχεσθε', 'πονηροῦ'] },
  { type: 'paronomasia', words: ['ὀφειλέταις', 'ὀφειλήματα'], canonical: true },
  { type: 'alliteration', words: ['ἄφες', 'ἀφήκαμεν'] },
  { type: 'homoioteleuton', words: ['Ἁγιασθήτω', 'ἐλθάτω', 'γενηθήτω'], canonical: true },
]

const hits = HIT_WHITELIST.map(({ type, words, canonical }) => {
  const cacheHit = cache.hits.find((h) => h.type === type && sameWordMultiset(h.evidence.words ?? [], words))
  if (!cacheHit) {
    throw new Error(`No cache hit found for type=${type} words=${JSON.stringify(words)}`)
  }

  // Walk the hit's spans in order, keeping only the refs whose surface form
  // is part of the matched word multiset (some hit types, e.g. homoioteleuton,
  // carry extra context spans beyond the actual matching words).
  const remaining = [...words]
  const matchedRefs = []
  for (const ref of cacheHit.spans) {
    const surface = tokenByRef(ref).surface
    const idx = remaining.indexOf(surface)
    if (idx !== -1) {
      remaining.splice(idx, 1)
      matchedRefs.push(ref)
    }
  }
  if (remaining.length > 0) {
    throw new Error(
      `Could not resolve every word to a span for type=${type} words=${JSON.stringify(words)}; unmatched=${JSON.stringify(remaining)}`,
    )
  }

  const tokenIndices = matchedRefs.map((ref) => refIndex.get(ref))

  const oldHit = findOldHit(type, words)
  const plain = oldHit?.plain ?? PLAIN_BY_TYPE[type] ?? type
  const rarity = oldHit?.rarity ?? cacheHit.one_in_n_corr ?? derivedRarity(cacheHit.z)

  return {
    type,
    plain,
    verses: cacheHit.verses,
    z: cacheHit.z,
    rarity,
    confidence: cacheHit.confidence,
    words: cacheHit.evidence.words,
    tokens: tokenIndices,
    ...(canonical ? { canonical: true } : {}),
  }
}).sort((a, b) => b.z - a.z)

// ---------------------------------------------------------------------------
// background — carried over from the cache's own background block
// ---------------------------------------------------------------------------

const background = {
  // Short label matches the old demo's phrasing; `window` below carries the
  // cache's fuller description verbatim.
  description: `${(cache.background.n_words / 1_000_000).toFixed(1)}M-word contemporaneous Koine background (50 BC – AD 150)`,
  n_words: cache.background.n_words,
  window: cache.background.window,
  phonology: cache.background.phonology,
  g2p_version: cache.background.g2p_version,
}

// ---------------------------------------------------------------------------
// Assemble + write
// ---------------------------------------------------------------------------

const out = {
  passage: oldDemo.passage,
  source: oldDemo.source,
  background,
  colors: oldDemo.colors,
  english: oldDemo.english,
  lines,
  tokens,
  hits,
}

fs.writeFileSync(DEMO_PATH, JSON.stringify(out, null, 1) + '\n', 'utf8')

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const totalSyllables = tokens.reduce((sum, t) => sum + t.syl, 0)

console.log(`lines: ${lines.length}`)
console.log(`tokens: ${tokens.length}`)
console.log(`total syllables: ${totalSyllables}`)
console.log(`hits: ${hits.length}`)
for (const h of hits) {
  console.log(
    `  z=${h.z.toFixed(2).padStart(5)}  ${h.type.padEnd(24)} ${h.canonical ? '[CANONICAL]' : ''.padEnd(0)} ${h.verses}  ${h.words.join(' / ')}`,
  )
}
