import { useEffect, useState } from 'react'
import { T, t } from './T'
import type { EssayField } from '../schema/types'

/**
 * A framed, captioned screenshot of the real app. The caption comes from
 * essay-content (editable in dev mode); alt text reuses the caption string.
 * Clicking the frame opens the capture in a full-viewport lightbox so the
 * dense UI stays legible.
 */
export function Shot({
  src,
  captionId,
  captionField = 'caption',
}: {
  src: string
  captionId: string
  captionField?: EssayField
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <figure className="shot">
      <button
        type="button"
        className="shot-frame"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge screenshot: ${t(captionId, captionField)}`}
      >
        <span className="bar" aria-hidden="true">
          <i /> <i /> <i />
          <em className="zoom">click to enlarge</em>
        </span>
        <img src={src} alt={t(captionId, captionField)} loading="lazy" />
      </button>
      <figcaption>
        <T id={captionId} field={captionField} />
      </figcaption>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <img src={src} alt={t(captionId, captionField)} />
          <button type="button" className="lightbox-close" aria-label="Close">
            ×
          </button>
        </div>
      )}
    </figure>
  )
}
