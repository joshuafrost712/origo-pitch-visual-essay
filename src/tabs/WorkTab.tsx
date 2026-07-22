import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { TabHero } from '../components/TabHero'
import { Shot } from '../components/Shot'
import { MsFigure } from '../components/MsFigure'
import { SearchDemo } from '../demos/SearchDemo'
import { SoundscapeDemo } from '../demos/SoundscapeDemo'

import msP46 from '../assets/manuscripts/p46-romans.jpg'
import msPoxy from '../assets/manuscripts/poxy5100-letter.jpg'
import msSinaiticus from '../assets/manuscripts/sinaiticus-matt6.jpg'
import shotSearchReader from '../assets/shots/search-reader.png'
import shotFilters from '../assets/shots/passage-hub.png'
import shotStructure from '../assets/shots/structure-mark1.png'
import shotStructureAligned from '../assets/shots/structure-beatitudes-aligned.png'

export function WorkTab() {
  return (
    <>
      <TabHero id="tab-work" creditId="ms-p46-credit" image={msP46} position="center 30%" />

      <Section id="journey1" kicker="j1-kicker" heading="j1-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['j1-problem']} />
          <T id="j1-question" field="quote" as="blockquote" className="rq" />
          <Prose ids={['j1-demo-lead']} />
        </div>
        <SearchDemo />
        <figcaption>
          <T id="j1-demo-caption" field="caption" />
        </figcaption>
        <Shot src={shotSearchReader} captionId="j1-reader-caption" />
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['j1-payoff']} />
        </div>
      </Section>

      <Section id="journey2" kicker="j2-kicker" heading="j2-heading" className="alt" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['j2-problem']} />
          <T id="j2-question" field="quote" as="blockquote" className="rq" />
        </div>
        <div className="split-figure">
          <div className="container" style={{ padding: 0 }}>
            <Prose ids={['j2-p1']} />
          </div>
          <MsFigure src={msPoxy} captionId="ms-poxy-caption" className="tall" />
        </div>
        <Shot src={shotFilters} captionId="j2-caption" />
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['j2-payoff']} />
        </div>
      </Section>

      <Section id="journey3" kicker="j3-kicker" heading="j3-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['j3-problem']} />
          <T id="j3-question" field="quote" as="blockquote" className="rq" />
          <Prose ids={['j3-p1']} />
        </div>
        <div className="shot-pair">
          <Shot src={shotStructure} captionId="j3-structure-caption" />
          <Shot src={shotStructureAligned} captionId="j3-structure-caption-aligned" />
        </div>
        <div className="split-figure reverse">
          <MsFigure src={msSinaiticus} captionId="ms-sinaiticus-caption" />
          <div className="container" style={{ padding: 0 }}>
            <Prose ids={['j3-demo-lead']} />
          </div>
        </div>
        <SoundscapeDemo />
        <figcaption>
          <T id="j3-demo-caption" field="caption" />
        </figcaption>
        <div className="container" style={{ padding: 0, marginTop: 26 }}>
          <Prose ids={['j3-payoff']} />
        </div>
      </Section>
    </>
  )
}
