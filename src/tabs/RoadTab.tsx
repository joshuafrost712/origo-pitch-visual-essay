import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { TabHero } from '../components/TabHero'
import { VisionScene } from '../components/VisionScene'
import { Scene4After, Scene4Before } from '../illustrations/visionFigures'

import msFlood from '../assets/manuscripts/flood-tablet.jpg'

const ROADMAP_STEPS = [1, 2, 3, 4, 5, 6, 7]

export function RoadTab() {
  return (
    <>
      <TabHero id="tab-road" creditId="ms-flood-credit" image={msFlood} position="center 35%" />

      <Section id="roadmap" kicker="roadmap-kicker" heading="roadmap-heading">
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
      <Section id="teamvision" kicker="sc4-kicker" heading="sc4-heading" className="alt" wide>
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

      <Section id="needs" kicker="needs-kicker" heading="needs-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['needs-p1']} />
        </div>
        <div className="needs-grid">
          {[1, 2, 3, 4].map((n) => (
            <div className="need" key={n}>
              <span className="n">{String(n).padStart(2, '0')}</span>
              <T id={`needs-${n}`} field="label" as="span" className="t" />
              <T id={`needs-${n}`} field="text" as="p" />
            </div>
          ))}
        </div>
      </Section>

      <Section id="model" kicker="model-kicker" heading="model-heading" className="alt">
        <Prose ids={['model-p1', 'model-p2', 'model-p3']} />
      </Section>
    </>
  )
}
