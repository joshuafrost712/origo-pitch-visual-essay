import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { TabHero } from '../components/TabHero'
import { VisionScene } from '../components/VisionScene'
import { Scene4After, Scene4Before } from '../illustrations/visionFigures'

import msFlood from '../assets/manuscripts/flood-tablet.jpg'

const ROADMAP_STEPS = [1, 2, 3, 4, 5, 6, 7]
const VISION_STAGES = [1, 2, 3, 4]

export function RoadTab() {
  return (
    <>
      <TabHero id="tab-road" creditId="ms-flood-credit" image={msFlood} position="center 35%" />

      {/* The four-stage vision leads the tab; the technical steps below are how
          stages 1 and 2 get built. Added 2026-11-18 at Joshua's direction. */}
      <Section id="vision" kicker="vision-kicker" heading="vision-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['vision-p1']} />
        </div>
        <ol className="stages">
          {VISION_STAGES.map((n) => (
            <li className="stage" key={n}>
              <T id={`vision-stage${n}`} field="kicker" as="span" className="stage__kicker" />
              <T id={`vision-stage${n}`} field="label" as="h3" className="stage__title" />
              <T id={`vision-stage${n}`} field="text" as="p" className="stage__text" />
              <T id={`vision-stage${n}`} field="caption" as="p" className="stage__milestone" />
            </li>
          ))}
        </ol>
      </Section>

      <Section id="roadmap" kicker="roadmap-kicker" heading="roadmap-heading" className="alt">
        <Prose ids={['roadmap-p1']} />
        <ol className="timeline">
          {ROADMAP_STEPS.map((n) => (
            <li key={n} style={{ transitionDelay: `${(n - 1) * 0.14}s` }}>
              <span className="dot" aria-hidden="true" />
              <T id={`roadmap-step${n}`} field="label" as="span" className="t-label" />
              <T id={`roadmap-step${n}`} field="text" as="span" className="t-text" />
            </li>
          ))}
        </ol>
        <Prose ids={['roadmap-p2']} />
      </Section>

      {/* Where the roadmap lands, with the beta claim held to what actually runs. */}
      <Section id="teamvision" kicker="sc4-kicker" heading="sc4-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['sc4-p1', 'sc4-p2', 'sc4-p3']} />
        </div>
        <VisionScene
          altId="sc4-figure-alt"
          beforeLabelId="sc4-before-label"
          beforeCaptionId="sc4-before-caption"
          afterLabelId="sc4-after-label"
          afterCaptionId="sc4-after-caption"
          before={(a) => <Scene4Before animated={a} />}
          after={(a) => <Scene4After animated={a} />}
        />
        <div className="container" style={{ padding: 0 }}>
          <T id="sc4-beta" field="text" as="p" className="beta-note" />
        </div>
      </Section>

      <Section id="needs" kicker="needs-kicker" heading="needs-heading" className="alt" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['needs-p1']} />
        </div>
        <div className="needs-grid">
          {[1, 2, 3, 4].map((n) => (
            <div className="need" key={n}>
              <span className="n">Need {n}</span>
              <T id={`needs-${n}`} field="label" as="span" className="t" />
              <T id={`needs-${n}`} field="text" as="p" />
            </div>
          ))}
        </div>
      </Section>

      <Section id="model" kicker="model-kicker" heading="model-heading">
        <Prose ids={['model-p1', 'model-p2', 'model-p3']} />
      </Section>
    </>
  )
}
