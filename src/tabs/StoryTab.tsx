import { useRef } from 'react'
import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { Bracelet } from '../illustrations/Bracelet'
import { useParallax } from '../lib/parallax'
import msP52 from '../assets/manuscripts/p52-recto.jpg'

function Hero() {
  const imgRef = useRef<HTMLDivElement>(null)
  useParallax(imgRef, 0.28, 1.15)
  return (
    <header className="hero">
      <div
        ref={imgRef}
        className="hero-img"
        style={{ backgroundImage: `url(${msP52})` }}
        aria-hidden="true"
      />
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-inner">
        <T id="hero-kicker" field="kicker" as="span" className="kicker" />
        <T id="hero-title" field="heading" as="h1" />
        <T id="hero-tagline" field="text" as="p" className="lede" />
      </div>
      <T id="ms-p52-credit" field="label" as="span" className="ms-credit" />
    </header>
  )
}

export function StoryTab() {
  return (
    <>
      <Hero />
      <Section id="bracelet" kicker="bracelet-kicker" heading="bracelet-heading">
        <div className="bracelet-split">
          <div>
            <Prose ids={['bracelet-p1', 'bracelet-p2']} />
          </div>
          <Bracelet />
        </div>
        <Prose ids={['bracelet-p3', 'bracelet-p4']} />
      </Section>
      <Section id="gap" kicker="gap-kicker" heading="gap-heading" className="alt">
        <Prose ids={['gap-p1', 'gap-p2', 'gap-p3']} />
      </Section>
    </>
  )
}
