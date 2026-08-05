import { useEffect, useRef, useState, type ReactNode } from 'react'
import { T } from './T'
import { usePrefersReducedMotion } from '../lib/reducedMotion'

/**
 * The before/after scene shell: two lanes, one trigger.
 *
 * The single IntersectionObserver is the point. Both lanes take their
 * `animated` state and their start moment from this one element, so the notes
 * scatter on the left in the same beat they land on the right. Wiring each lane
 * to its own trigger produces two animations that happen to be near each other,
 * which is not a contrast.
 *
 * Under reduced motion the observer is skipped entirely and each figure renders
 * its static branch, which is the strongest single frame rather than the
 * animated end state (see `visionFigures`).
 */
export function VisionScene({
  altId,
  beforeLabelId,
  beforeCaptionId,
  afterLabelId,
  afterCaptionId,
  before,
  after,
}: {
  altId: string
  beforeLabelId: string
  beforeCaptionId: string
  afterLabelId: string
  afterCaptionId: string
  before: (animated: boolean) => ReactNode
  after: (animated: boolean) => ReactNode
}) {
  const reduced = usePrefersReducedMotion()
  const animated = !reduced
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!animated) return
    const el = ref.current
    if (!el) return
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
  }, [animated])

  return (
    <div
      ref={ref}
      className={`vs-lanes ${animated ? '' : 'vs-static'} ${animated && on ? 'on' : ''}`}
    >
      {/* One description for one idea. Two half-descriptions of two lanes would
          leave a screen-reader user with the diagram's parts and not its point. */}
      <p className="vs-sr-only">
        <T id={altId} field="text" />
      </p>
      <div className="vs-lane">
        <T id={beforeLabelId} field="label" as="p" className="vs-lane__label" />
        {before(animated)}
        <T id={beforeCaptionId} field="caption" as="p" className="vs-lane__caption" />
      </div>
      <div className="vs-lane vs-lane--with">
        <T id={afterLabelId} field="label" as="p" className="vs-lane__label" />
        {after(animated)}
        <T
          id={afterCaptionId}
          field="caption"
          as="p"
          className="vs-lane__caption vs-lane__caption--with"
        />
      </div>
    </div>
  )
}
