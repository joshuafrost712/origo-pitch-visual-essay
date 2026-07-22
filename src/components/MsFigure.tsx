import { T, t } from './T'

/** A manuscript photograph presented as an unframed archival figure,
 *  captioned from essay-content (credit included in the caption). */
export function MsFigure({
  src,
  captionId,
  className = '',
}: {
  src: string
  captionId: string
  className?: string
}) {
  return (
    <figure className={`ms-figure ${className}`}>
      <img src={src} alt={t(captionId, 'caption')} loading="lazy" />
      <figcaption>
        <T id={captionId} field="caption" />
      </figcaption>
    </figure>
  )
}
