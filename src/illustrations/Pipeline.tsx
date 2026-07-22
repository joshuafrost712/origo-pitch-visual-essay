import { useEffect, useRef, useState } from 'react'
import { T } from '../components/T'

/** Small stroke glyphs for the five pipeline stages, drawn in the site palette. */
function Glyph({ n }: { n: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (n) {
    case 1: // original text: scroll
      return (
        <svg viewBox="0 0 32 32" {...{ width: 30, height: 30 }}>
          <path {...common} d="M9 5h16a3 3 0 0 1 0 6M9 5a3 3 0 0 0-3 3v16a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3V8M11 13h8M11 18h8M11 23h5" />
        </svg>
      )
    case 2: // interlinear: stacked aligned rows
      return (
        <svg viewBox="0 0 32 32" {...{ width: 30, height: 30 }}>
          <path {...common} d="M6 8h20M6 14h20M6 20h12M6 26h16" />
          <path {...common} d="M10 5v6M18 5v6M26 5v6" opacity="0.55" />
        </svg>
      )
    case 3: // translation: two speech panes
      return (
        <svg viewBox="0 0 32 32" {...{ width: 30, height: 30 }}>
          <rect {...common} x="4" y="6" width="11" height="20" rx="2" />
          <rect {...common} x="17" y="6" width="11" height="20" rx="2" />
          <path {...common} d="M7 12h5M7 17h5M20 12h5M20 17h5" opacity="0.6" />
        </svg>
      )
    case 4: // metadata: tags
      return (
        <svg viewBox="0 0 32 32" {...{ width: 30, height: 30 }}>
          <path {...common} d="M5 14V6h8l13 13-8 8L5 14Z" />
          <circle {...common} cx="10.5" cy="11.5" r="1.6" />
        </svg>
      )
    default: // vector index: node net
      return (
        <svg viewBox="0 0 32 32" {...{ width: 30, height: 30 }}>
          <circle {...common} cx="8" cy="8" r="2.6" />
          <circle {...common} cx="24" cy="10" r="2.6" />
          <circle {...common} cx="12" cy="24" r="2.6" />
          <circle {...common} cx="25" cy="23" r="2.6" />
          <path {...common} d="M10.4 9.2 21.6 9.6M9.2 10.4l2 11M14.4 22.8l8-0.5M22.6 12.3l1.7 8.2" opacity="0.6" />
        </svg>
      )
  }
}

/**
 * The per-text pipeline as a five-stage strip that lights up stage by stage
 * when scrolled into view. Labels are content nodes (editable in dev mode).
 */
export function Pipeline() {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOn(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`pipeline ${on ? 'on' : ''}`}>
      <T id="pipeline-title" field="label" as="span" className="pipeline-title" />
      <div className="pipeline-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <div className="pipeline-stage" key={n} style={{ transitionDelay: `${(n - 1) * 0.28}s` }}>
            <span className="glyph">
              <Glyph n={n} />
            </span>
            <T id={`pipeline-s${n}`} field="label" as="span" className="lbl" />
            {n < 5 && (
              <span className="arrow" aria-hidden="true" style={{ transitionDelay: `${(n - 1) * 0.28 + 0.14}s` }}>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
