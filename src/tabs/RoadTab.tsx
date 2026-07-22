import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { TabHero } from '../components/TabHero'

import msFlood from '../assets/manuscripts/flood-tablet.jpg'

export function RoadTab() {
  return (
    <>
      <TabHero id="tab-road" creditId="ms-flood-credit" image={msFlood} position="center 35%" />

      <Section id="roadmap" kicker="roadmap-kicker" heading="roadmap-heading">
        <Prose ids={['roadmap-p1']} />
        <ol className="timeline">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <li key={n} style={{ transitionDelay: `${(n - 1) * 0.16}s` }}>
              <span className="dot" aria-hidden="true" />
              <T id={`roadmap-step${n}`} field="label" as="span" className="t-label" />
              <T id={`roadmap-step${n}`} field="text" as="span" className="t-text" />
            </li>
          ))}
        </ol>
        <Prose ids={['roadmap-p2']} />
      </Section>

      <Section id="needs" kicker="needs-kicker" heading="needs-heading" className="alt" wide>
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

      <Section id="model" kicker="model-kicker" heading="model-heading">
        <Prose ids={['model-p1', 'model-p2']} />
      </Section>
    </>
  )
}
