import { useState } from 'react'
import data from './soundscape-matt6.json'

interface Hit {
  type: string
  plain: string
  verses: string
  z: number
  rarity: string
  words: string[]
  tokens: number[]
}

const hits = data.hits as Hit[]
const colors = data.colors as Record<string, string>
const english = data.english as Record<string, string>

/**
 * Miniature of the Soundscape viewer: the Greek of Matthew 6:9-13 with the
 * detector's own findings, in the app's own class colors, from frozen output
 * of the live /api/soundscape endpoint. Selecting a finding lights up the
 * words that carry it and shows the English of the verses involved.
 */
export function SoundscapeDemo() {
  const [sel, setSel] = useState(0)
  const hit = hits[sel]
  const lit = new Set(hit?.tokens ?? [])
  const color = colors[hit?.type] ?? '#0f9b8e'

  const verseSpan = (() => {
    if (!hit) return []
    const vs = new Set<number>()
    for (const i of hit.tokens) vs.add(data.tokens[i].v as number)
    return [...vs].sort((a, b) => a - b)
  })()

  let lastVerse = 0
  return (
    <div className="demo" aria-label="Interactive sound-play demo">
      <div className="demo-titlebar">
        <span className="brand">
          Origo <span>Research</span>
        </span>
        <span>· Soundscape · {data.passage}</span>
        <span className="live">replaying real engine output</span>
      </div>
      <div className="demo-body">
        <div className="ss-cols" style={{ ['--hl' as string]: color }}>
          <div className="ss-text" lang="grc">
            {data.tokens.map((tok, i) => {
              const showV = tok.v !== lastVerse
              lastVerse = tok.v as number
              return (
                <span key={i}>
                  {showV && <span className="ss-vnum">{tok.v}</span>}
                  <span className={`ss-tok ${lit.has(i) ? 'hl' : ''}`}>{tok.s}</span>
                  {tok.p ? tok.p : ''}{' '}
                </span>
              )
            })}
          </div>
          <div className="ss-list" role="listbox" aria-label="Detected sound plays">
            {hits.map((h, i) => (
              <button
                key={i}
                className={`ss-hit ${i === sel ? 'on' : ''}`}
                style={{ ['--hl' as string]: colors[h.type] ?? '#0f9b8e' }}
                onClick={() => setSel(i)}
                aria-pressed={i === sel}
              >
                <span className="chip" aria-hidden="true" />
                <span className="ty">{h.plain}</span>
                <div className="meta">
                  {h.verses} · strength {h.z}σ · {h.words.slice(0, 4).join(' · ')}
                </div>
              </button>
            ))}
          </div>
          <div className="ss-english">
            {verseSpan.map((v) => (
              <span key={v}>
                <strong>v{v}</strong> {english[String(v)]}{' '}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
