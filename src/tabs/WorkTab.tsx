import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { TabHero } from '../components/TabHero'
import { Shot } from '../components/Shot'
import { MsFigure } from '../components/MsFigure'
import { ScrollStage } from '../components/ScrollStage'
import { SearchDemo } from '../demos/SearchDemo'
import { SoundscapeDemo } from '../demos/SoundscapeDemo'

import msP46 from '../assets/manuscripts/p46-romans.jpg'
import msSinaiticus from '../assets/manuscripts/sinaiticus-matt6.jpg'
import artMyrrh from '../assets/manuscripts/myrrhbearers.jpg'
import artIcon from '../assets/manuscripts/empty-tomb-angel.jpg'
import photoTomb from '../assets/manuscripts/jerusalem-tomb.jpg'
import shotSearchReader from '../assets/shots/search-reader.png'
import shotFilters from '../assets/shots/passage-hub.png'
import shotStructure from '../assets/shots/structure-mark1.png'
import shotStructureAligned from '../assets/shots/structure-beatitudes-aligned.png'

const SEARCH_HOTSPOTS = [
  { label: 'The real search page, before anyone types a word', x: 0.5, y: 0.36, scale: 1 },
  { label: 'Describe what you want in plain language', x: 0.13, y: 0.28, scale: 1.9 },
  { label: 'Or set the filters by hand: every tradition of the ancient world, in one rail', x: 0.12, y: 0.53, scale: 1.8 },
  { label: 'Narrow it down to a range of years', x: 0.12, y: 0.75, scale: 1.9 },
]

const ALIGNED_HOTSPOTS = [
  { label: 'The Beatitudes, as the Structure viewer lays them out', x: 0.5, y: 0.35, scale: 1 },
  { label: 'Eight blessings, each opening with μακάριοι', x: 0.3, y: 0.62, scale: 1.6 },
  { label: 'Named figures, judged “deliberate artistry, strongly supported”', x: 0.85, y: 0.5, scale: 1.7 },
  { label: 'The eight members lined up column by column', x: 0.8, y: 0.97, scale: 2.1 },
]

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
        <div className="fig-row">
          <MsFigure src={artMyrrh} captionId="ms-myrrhbearers-caption" className="row" />
          <MsFigure src={artIcon} captionId="ms-icon-caption" className="row" />
          <MsFigure src={photoTomb} captionId="ms-tomb-caption" className="row" />
        </div>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['j2-p1']} />
        </div>
        <ScrollStage src={shotFilters} captionId="j2-caption" hotspots={SEARCH_HOTSPOTS} />
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
        <Shot src={shotStructure} captionId="j3-structure-caption" />
        <ScrollStage src={shotStructureAligned} captionId="j3-structure-caption-aligned" hotspots={ALIGNED_HOTSPOTS} />
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
