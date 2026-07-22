import { useState } from 'react'
import data from './search-martureo.json'

/**
 * Working recreation of the corpus search screen, styled with the app's real
 * palette (gold Scripture cards, tier badges) and replaying frozen output of
 * the live POST /api/search endpoint for the lemma μαρτυρέω.
 */
export function SearchDemo() {
  const [phase, setPhase] = useState<'idle' | 'searching' | 'done'>('idle')

  const run = () => {
    if (phase !== 'idle') return
    setPhase('searching')
    window.setTimeout(() => setPhase('done'), 650)
  }

  return (
    <div className="demo" aria-label="Interactive search demo">
      <div className="demo-titlebar">
        <span className="brand">
          Origo <span>Research</span>
        </span>
        <span>· Corpus search</span>
        <span className="live">replaying real engine output</span>
      </div>
      <div className="demo-body">
        <div className="sd-row">
          <input className="sd-input" value="μαρτυρέω" readOnly aria-label="Lemma query" />
          <button className="sd-btn" onClick={run} disabled={phase !== 'idle'}>
            {phase === 'searching' ? 'Searching…' : 'Search'}
          </button>
          <span className="sd-hint">
            Lemma (Greek/Hebrew) · finds every inflected form of the word
          </span>
        </div>

        {phase === 'done' && (
          <>
            <div className="sd-count">
              {data.n_matches} match(es) · showing {data.results.length} · mode: lemma
            </div>
            <div className="sd-results">
              {data.results.map((r, i) => (
                <div className="sd-card" key={r.reference} style={{ animationDelay: `${i * 70}ms` }}>
                  <span className="ref">{r.reference}</span>
                  <span className="sd-badges">
                    <span className="badge scripture">✦ {r.collection}</span>
                    <span className="badge high">{r.tier}</span>
                  </span>
                  <div className="greek">
                    {r.hits} hit(s): {r.surfaces.join(' / ')}
                  </div>
                  <div className="gloss">{r.glosses.join(' / ')}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
