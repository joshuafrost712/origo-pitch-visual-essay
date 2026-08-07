import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { TabHero } from '../components/TabHero'
import { TrustDiagram } from '../illustrations/TrustDiagram'
import { QualityMap } from '../illustrations/QualityMap'

// A documentary papyrus, because the documentary layer is what the confidence
// gate mostly guards. Deliberately NOT the coach screenshot that `trust-caption`
// describes: that shot carries Aquifer labels and does not ship (spec item 6).
import msPoxy from '../assets/manuscripts/poxy5100-letter.jpg'

/**
 * Quality control, in one place.
 *
 * The `trust` section moved here off the Engine tab so the whole QA argument
 * reads as one thing: the ladder of guarantees, then the six-step walk-through
 * of a single text, then the map of every check with its boundary and the five
 * errors named, each with a scheduled fix behind it. The honesty is the
 * credibility argument; a filtered version of this page would be worth less than
 * no page.
 */
export function QualityTab() {
  return (
    <>
      <TabHero id="tab-quality" creditId="ms-poxy-credit" image={msPoxy} position="center 35%" />

      <Section id="trust" kicker="trust-kicker" heading="trust-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['trust-p1', 'trust-p2']} />
        </div>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['trust-lead']} />
        </div>
        <TrustDiagram />
      </Section>

      <Section id="qmap" kicker="qmap-kicker" heading="qmap-heading" className="alt" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['qmap-p1', 'qmap-p2']} />
        </div>
        <QualityMap />
        <div className="container" style={{ padding: 0 }}>
          <T id="qmap-gaps-title" field="label" as="h3" className="qm-after-title" />
          <Prose ids={['qmap-gaps-p1', 'qmap-count']} />
        </div>
      </Section>
    </>
  )
}
