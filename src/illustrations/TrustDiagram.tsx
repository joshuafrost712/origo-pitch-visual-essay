import { useState } from 'react'
import { T, t } from '../components/T'

/** The six steps a text passes through before it earns a place in the corpus.
 *  Node ids resolve to editable label + text in essay-content. */
const STEPS = ['qc-1', 'qc-2', 'qc-3', 'qc-4', 'qc-5', 'qc-6']

/**
 * Interactive quality-control walk-through. The reader clicks (or tabs) through
 * each stage of the pipeline that carries a raw manuscript into the corpus and
 * reads what happens there, which kind of model does the work, and where a human
 * signs off. It is a diagram, not decoration: every panel is real process.
 */
export function TrustDiagram() {
  const [sel, setSel] = useState(0)

  return (
    <section className="trust-diagram" aria-label={t('qc-title', 'label')}>
      <T id="qc-title" field="label" as="span" className="td-title" />

      <div className="td-track" role="tablist" aria-label="Quality-control steps">
        {STEPS.map((id, i) => (
          <button
            key={id}
            role="tab"
            id={`td-tab-${i}`}
            aria-selected={sel === i}
            aria-controls="td-panel"
            className={`td-node ${sel === i ? 'on' : ''} ${i < sel ? 'done' : ''}`}
            onClick={() => setSel(i)}
            onFocus={() => setSel(i)}
          >
            <span className="td-num" aria-hidden="true">
              {i + 1}
            </span>
            <T id={id} field="label" as="span" className="td-node-label" />
            {i < STEPS.length - 1 && (
              <span className="td-arrow" aria-hidden="true">
                →
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="td-panel" id="td-panel" role="tabpanel" aria-labelledby={`td-tab-${sel}`}>
        <div className="td-panel-num" aria-hidden="true">
          Step {sel + 1} of {STEPS.length}
        </div>
        <T id={STEPS[sel]} field="label" as="h3" className="td-panel-title" />
        <T id={STEPS[sel]} field="text" as="p" className="td-panel-text" />
        <div className="td-nav">
          <button
            type="button"
            className="td-step-btn"
            onClick={() => setSel((s) => Math.max(0, s - 1))}
            disabled={sel === 0}
          >
            ← Back
          </button>
          <button
            type="button"
            className="td-step-btn"
            onClick={() => setSel((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={sel === STEPS.length - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  )
}
