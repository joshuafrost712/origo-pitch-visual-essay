import { useRef } from 'react'
import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { VisionScene } from '../components/VisionScene'
import { Bracelet } from '../illustrations/Bracelet'
import {
  Scene1After,
  Scene1Before,
  Scene2After,
  Scene2Before,
  Scene3After,
  Scene3Before,
} from '../illustrations/visionFigures'
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

/**
 * The story tab now carries three before/after scenes rather than a bare
 * problem statement. Scene one IS the reworked `gap` section: the same kicker,
 * heading and prose, with the two-lane figure standing where a wall of text
 * used to, and the v2 survey sentence folded into its copy.
 */
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

      <Section id="gap" kicker="gap-kicker" heading="gap-heading" className="alt" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['gap-p1', 'gap-p2']} />
        </div>
        <VisionScene
          altId="sc1-figure-alt"
          beforeLabelId="sc1-before-label"
          beforeCaptionId="sc1-before-caption"
          afterLabelId="sc1-after-label"
          afterCaptionId="sc1-after-caption"
          before={(a) => <Scene1Before animated={a} />}
          after={(a) => <Scene1After animated={a} />}
        />
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['gap-p3']} />
        </div>
      </Section>

      <Section id="vision2" kicker="sc2-kicker" heading="sc2-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['sc2-p1', 'sc2-p2']} />
        </div>
        <VisionScene
          altId="sc2-figure-alt"
          beforeLabelId="sc2-before-label"
          beforeCaptionId="sc2-before-caption"
          afterLabelId="sc2-after-label"
          afterCaptionId="sc2-after-caption"
          before={(a) => <Scene2Before animated={a} />}
          after={(a) => <Scene2After animated={a} />}
        />
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['sc2-p3']} />
        </div>
      </Section>

      <Section id="vision3" kicker="sc3-kicker" heading="sc3-heading" className="alt" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['sc3-p1', 'sc3-p2']} />
        </div>
        <VisionScene
          altId="sc3-figure-alt"
          beforeLabelId="sc3-before-label"
          beforeCaptionId="sc3-before-caption"
          afterLabelId="sc3-after-label"
          afterCaptionId="sc3-after-caption"
          before={(a) => <Scene3Before animated={a} />}
          after={(a) => <Scene3After animated={a} />}
        />
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['sc3-p3']} />
        </div>
      </Section>
    </>
  )
}
