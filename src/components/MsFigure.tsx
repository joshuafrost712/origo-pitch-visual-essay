import { useEffect, useState } from 'react'
import { T, t } from './T'

/** A manuscript or artwork figure presented as an unframed archival image,
 *  captioned from essay-content (credit included in the caption). Clicking it
 *  opens the full image in a lightbox, so a row-cropped thumbnail stays
 *  inspectable at full resolution. */
export function MsFigure({
  src,
  captionId,
  className = '',
}: {
  src: string
  captionId: string
  className?: string
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
    <figure className={`ms-figure ${className}`}>
      <button type="button" className="ms-figbtn" onClick={() => setOpen(true)} aria-label={`Enlarge: ${t(captionId, 'caption')}`}>
        <img src={src} alt={t(captionId, 'caption')} loading="lazy" />
      </button>
      <figcaption>
        <T id={captionId} field="caption" />
      </figcaption>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <img src={src} alt={t(captionId, 'caption')} />
          <button type="button" className="lightbox-close" aria-label="Close">
            ×
          </button>
        </div>
      )}
    </figure>
  )
}
