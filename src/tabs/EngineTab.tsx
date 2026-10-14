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
import shotCatalogue from '../assets/shots/catalogue-find.png'

const STATS: Array<{ id: string; approx?: boolean }> = [
  { id: 'engine-stat-files' },
  { id: 'engine-stat-collections' },
  { id: 'engine-stat-works' },
  { id: 'engine-stat-tokens', approx: true },
  { id: 'engine-stat-links' },
]

const NOW = ['state-now-1', 'state-now-2', 'state-now-3', 'state-now-4', 'state-now-5']
const REST = [
  'state-rest-1',
  'state-rest-2',
  'state-rest-3',
  'state-rest-4',
  'state-rest-5',
  'state-rest-6',
]

/** One column of the working-today / still-to-do split. */
function StateColumn({ titleId, ids, kind }: { titleId: string; ids: string[]; kind: 'now' | 'rest' }) {
  return (
    <div className={`st-col st-col--${kind}`}>
      <T id={titleId} field="label" as="h3" className="st-col__title" />
      <ul className="st-list">
        {ids.map((id) => (
          <li key={id} className="st-item">
            <span className="st-item__mark" aria-hidden="true">
              {kind === 'now' ? '✓' : '○'}
            </span>
            <div>
              <T id={id} field="label" as="span" className="st-item__label" />
              <T id={id} field="text" as="p" className="st-item__text" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

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
        <div className="container" style={{ padding: 0, marginTop: 24 }}>
          <Shot src={shotCatalogue} captionId="engine-catalogue-caption" />
        </div>
      </Section>

      {/* The honest where-we-are block sits directly under the stat row, because
          a number is the easiest thing on a page to over-read. */}
      <Section id="state" kicker="state-kicker" heading="state-heading" className="alt" wide>
        <div className="container" style={{ padding: 0 }}>
          <Prose ids={['state-p1']} />
        </div>
        <div className="st-split">
          <StateColumn titleId="state-now-title" ids={NOW} kind="now" />
          <StateColumn titleId="state-rest-title" ids={REST} kind="rest" />
        </div>
      </Section>

      <Section id="pkm" kicker="pkm-kicker" heading="pkm-heading">
        <Prose ids={['pkm-p1', 'pkm-p2']} />
      </Section>
    </>
  )
}
