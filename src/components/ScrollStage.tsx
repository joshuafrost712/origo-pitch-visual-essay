import { useEffect, useRef, useState } from 'react'
import { T, t } from './T'

/** One zoom target over the image. x/y are 0..1 fractions of the frame
 *  (the point the zoom centres on); scale is the zoom factor (1 = full view). */
export interface Hotspot {
  label: string
  x: number
  y: number
  scale: number
}

/**
 * A "scroll it like a short film" figure: the image is pinned while the reader
 * scrolls past, panning and zooming from one labelled hotspot to the next so
 * attention is walked across a dense screenshot. Under prefers-reduced-motion
 * it collapses to the plain full image with the hotspot labels listed beneath.
 */
export function ScrollStage({
  src,
  captionId,
  hotspots,
}: {
  src: string
  captionId: string
  hotspots: Hotspot[]
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    if (mq.matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight
        const range = rect.height - vh
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(range, 1))
        const p = range > 0 ? scrolled / range : 0
        const i = Math.min(hotspots.length - 1, Math.max(0, Math.floor(p * hotspots.length)))
        setIdx(i)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [hotspots.length])

  const hs = hotspots[idx] ?? hotspots[0]

  if (reduced) {
    return (
      <figure className="scrollstage-static">
        <div className="shot-frame" aria-hidden={false}>
          <img src={src} alt={t(captionId, 'caption')} />
        </div>
        <ol className="scrollstage-steps">
          {hotspots.slice(1).map((h, i) => (
            <li key={i}>{h.label}</li>
          ))}
        </ol>
        <figcaption>
          <T id={captionId} field="caption" />
        </figcaption>
      </figure>
    )
  }

  return (
    <div
      className="scrollstage"
      ref={wrapRef}
      style={{ height: `${hotspots.length * 62 + 8}vh` }}
      aria-label={t(captionId, 'caption')}
    >
      <div className="scrollstage-sticky">
        <figure className="scrollstage-frame">
          <span className="bar" aria-hidden="true">
            <i /> <i /> <i />
            <em className="zoom">a guided look</em>
          </span>
          <div className="scrollstage-viewport">
            <img
              src={src}
              alt={t(captionId, 'caption')}
              style={{ transformOrigin: `${hs.x * 100}% ${hs.y * 100}%`, transform: `scale(${hs.scale})` }}
            />
            {hs.scale > 1 && (
              <span
                className="scrollstage-pin"
                style={{ left: `${hs.x * 100}%`, top: `${hs.y * 100}%` }}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="scrollstage-hud">
            <span className="dots" aria-hidden="true">
              {hotspots.map((_, i) => (
                <span key={i} className={i === idx ? 'on' : ''} />
              ))}
            </span>
            <span className="step-label" aria-live="polite">
              {hs.label}
            </span>
          </div>
          <figcaption>
            <T id={captionId} field="caption" />
          </figcaption>
        </figure>
      </div>
    </div>
  )
}
