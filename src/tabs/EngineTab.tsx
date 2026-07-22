import { Section, Prose } from '../components/Section'
import { T } from '../components/T'
import { TabHero } from '../components/TabHero'
import { Shot } from '../components/Shot'
import { Counter } from '../components/Counter'
import { Pipeline } from '../illustrations/Pipeline'
import { findNode } from '../lib/content/loader'

import msIsaiah from '../assets/manuscripts/isaiah-scroll.jpg'
import shotWorkspace from '../assets/shots/app-workspace.png'
import shotCommentaries from '../assets/shots/commentaries-landing.png'
import shotCoach from '../assets/shots/coach-landing.png'

const STATS: Array<{ id: string; approx?: boolean }> = [
  { id: 'engine-stat-files' },
  { id: 'engine-stat-collections' },
  { id: 'engine-stat-works' },
  { id: 'engine-stat-tokens', approx: true },
  { id: 'engine-stat-links' },
]

export function EngineTab() {
  return (
    <>
      <TabHero id="tab-engine" creditId="ms-isaiah-credit" image={msIsaiah} position="center 40%" />

      <Section id="engine" kicker="engine-kicker" heading="engine-heading" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['engine-p1']} />
        </div>
        <div className="stats">
          {STATS.map(({ id, approx }) => {
            const n = Number(findNode(id)?.node.note ?? 0)
            return (
              <div className="stat" key={id}>
                <Counter value={n} approx={approx} />
                <T id={id} field="label" as="div" className="lbl" />
              </div>
            )
          })}
        </div>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['engine-p2']} />
        </div>
        <Pipeline />
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['engine-p3']} />
        </div>
        <div className="shot-pair">
          <Shot src={shotWorkspace} captionId="engine-workspace-caption" />
          <Shot src={shotCommentaries} captionId="engine-commentaries-caption" />
        </div>
      </Section>

      <Section id="trust" kicker="trust-kicker" heading="trust-heading" className="alt" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['trust-p1', 'trust-p2']} />
        </div>
        <Shot src={shotCoach} captionId="trust-caption" />
      </Section>
    </>
  )
}
