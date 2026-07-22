import { T, t } from './T'
import type { EssayField } from '../schema/types'

/**
 * A framed, captioned screenshot of the real app. The caption comes from
 * essay-content (editable in dev mode); alt text reuses the caption string.
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
  return (
    <figure className="shot">
      <div className="shot-frame">
        <div className="bar" aria-hidden="true">
          <i /> <i /> <i />
        </div>
        <img src={src} alt={t(captionId, captionField)} loading="lazy" />
      </div>
      <figcaption>
        <T id={captionId} field={captionField} />
      </figcaption>
    </figure>
  )
}
