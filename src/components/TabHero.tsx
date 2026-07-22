import { useRef } from 'react'
import { T } from './T'
import { useParallax } from '../lib/parallax'

/** Compact opening band for tabs 2-5: kicker + title + one-line intro over a
 *  faded, slate-graded manuscript backdrop with a small credit line. With no
 *  image it renders the plain slate band with the teal glow. */
export function TabHero({
  id,
  creditId,
  image,
  position = 'center',
}: {
  id: string
  creditId?: string
  image?: string
  position?: string
}) {
  const imgRef = useRef<HTMLDivElement>(null)
  useParallax(imgRef)

  return (
    <header className="tab-hero">
      {image && (
        <div
          ref={imgRef}
          className="tab-hero-img"
          style={{ backgroundImage: `url(${image})`, backgroundPosition: position }}
          aria-hidden="true"
        />
      )}
      <div className="tab-hero-scrim" aria-hidden="true" />
      <div className="tab-hero-inner">
        <T id={id} field="kicker" as="span" className="kicker" />
        <T id={id} field="heading" as="h1" />
        <T id={id} field="text" as="p" className="lede" />
      </div>
      {creditId && <T id={creditId} field="label" as="span" className="ms-credit" />}
    </header>
  )
}
