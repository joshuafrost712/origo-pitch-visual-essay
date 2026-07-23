import { useState } from 'react'
import data from './soundscape-matt6.json'

interface Hit {
  type: string
  plain: string
  verses: string
  z: number
  rarity: string
  confidence?: string
  words: string[]
  tokens: number[]
  canonical?: boolean
}
interface Token {
  v: number
  s: string
  g: string
  p: string
  syl: number
}
interface Line {
  v: number
  english: string
  tokenIdx: number[]
  wordCount: number
  syllableCount: number
}

const hits = data.hits as Hit[]
const colors = data.colors as Record<string, string>
const tokens = data.tokens as Token[]
const lines = data.lines as Line[]

const CANONICAL = hits.map((h, i) => (h.canonical ? i : -1)).filter((i) => i >= 0)

/**
 * The Lord's Prayer as the Soundscape viewer hears it: the Greek laid out line
 * by line with its word and syllable counts, and the detector's own findings on
 * the right in the app's class colours. The three canonical sound plays are lit
 * on load; tap any finding to add or remove its colour. Frozen real output of
 * the live /api/soundscape endpoint.
 */
export function SoundscapeDemo() {
  const [sel, setSel] = useState<Set<number>>(new Set(CANONICAL))

  const toggle = (i: number) =>
    setSel((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  // token index -> colour of the strongest (highest z) selected finding covering it
  const tokColor = new Map<number, string>()
  ;[...sel]
    .map((i) => hits[i])
    .sort((a, b) => b.z - a.z)
    .forEach((h) => {
      for (const ti of h.tokens) if (!tokColor.has(ti)) tokColor.set(ti, colors[h.type] ?? '#0f9b8e')
    })

  return (
    <div className="demo lp" aria-label="Interactive Lord's Prayer sound-play viewer">
      <div className="demo-titlebar">
        <span className="brand">
          Origo <span>Research</span>
        </span>
        <span>· Soundscape · {data.passage}</span>
        <span className="live">replaying real engine output</span>
      </div>
      <div className="demo-body">
        <div className="lp-cols">
          <div className="lp-poem" lang="grc">
            {lines.map((line) => (
              <div className="lp-line" key={line.v}>
                <div className="lp-line-head">
                  <span className="lp-vnum">v{line.v}</span>
                  <span className="lp-metrics" aria-label={`${line.wordCount} words, ${line.syllableCount} syllables`}>
                    {line.wordCount} words · {line.syllableCount} syllables
                  </span>
                </div>
                <div className="lp-greek">
                  {line.tokenIdx.map((ti) => {
                    const tok = tokens[ti]
                    const c = tokColor.get(ti)
                    return (
                      <span key={ti}>
                        <span
                          className={`ss-tok ${c ? 'hl' : ''}`}
                          style={c ? { ['--hl' as string]: c } : undefined}
                        >
                          {tok.s}
                        </span>
                        {tok.p}{' '}
                      </span>
                    )
                  })}
                </div>
                <div className="lp-en" lang="en">
                  {line.english}
                </div>
              </div>
            ))}
          </div>

          <div className="lp-aspects" role="group" aria-label="Detected sound plays">
            <div className="lp-key-title">Sound plays detected</div>
            {hits.map((h, i) => (
              <button
                key={i}
                className={`ss-hit ${sel.has(i) ? 'on' : ''}`}
                style={{ ['--hl' as string]: colors[h.type] ?? '#0f9b8e' }}
                onClick={() => toggle(i)}
                aria-pressed={sel.has(i)}
              >
                <span className="chip" aria-hidden="true" />
                <span className="ty">
                  {h.plain}
                  {h.canonical && <em className="star">most significant</em>}
                </span>
                <div className="meta">
                  {h.verses} · {h.z}σ · {h.rarity} · {h.words.slice(0, 4).join(' · ')}
                </div>
              </button>
            ))}
            <p className="lp-note">
              Every finding is graded against a 4.5-million-word background of ordinary contemporaneous Greek, so a
              pattern only counts when chance cannot easily explain it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
