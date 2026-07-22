import { DevFeedbackRoot } from './devfeedback/DevFeedbackRoot'
import { T, t } from './components/T'
import { Reveal } from './components/Reveal'
import { Counter } from './components/Counter'
import { Shot } from './components/Shot'
import { SearchDemo } from './demos/SearchDemo'
import { SoundscapeDemo } from './demos/SoundscapeDemo'
import { findNode } from './lib/content/loader'

import shotSearchReader from './assets/shots/search-reader.png'
import shotFilters from './assets/shots/passage-hub.png'
import shotStructure from './assets/shots/structure-mark1.png'
import shotStructureAligned from './assets/shots/structure-beatitudes-aligned.png'
import shotWorkspace from './assets/shots/app-workspace.png'
import shotCommentaries from './assets/shots/commentaries-landing.png'
import shotCoach from './assets/shots/coach-landing.png'

function Hero() {
  return (
    <header className="hero">
      <T id="hero-kicker" field="kicker" as="span" className="kicker" />
      <T id="hero-title" field="heading" as="h1" />
      <T id="hero-tagline" field="text" as="p" className="lede" />
      <T id="hero-scroll" field="label" as="span" className="hero-scroll" />
    </header>
  )
}

function Prose({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id) => (
        <T key={id} id={id} field="text" as="p" />
      ))}
    </>
  )
}

function Section({
  id,
  kicker,
  heading,
  className = '',
  wide = false,
  children,
}: {
  id: string
  kicker?: string
  heading: string
  className?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`section ${className}`} id={id}>
      <div className={`container ${wide ? 'wide' : ''}`}>
        <Reveal>
          {kicker && <T id={kicker} field="kicker" as="span" className="kicker" />}
          <T id={heading} field="heading" as="h2" />
          {children}
        </Reveal>
      </div>
    </section>
  )
}

const STATS: Array<{ id: string; approx?: boolean }> = [
  { id: 'engine-stat-files' },
  { id: 'engine-stat-collections' },
  { id: 'engine-stat-works' },
  { id: 'engine-stat-tokens', approx: true },
  { id: 'engine-stat-links' },
]

export function App() {
  return (
    <>
      <main className="essay">
        <Hero />

        <Section id="bracelet" kicker="bracelet-kicker" heading="bracelet-heading">
          <Prose ids={['bracelet-p1', 'bracelet-p2', 'bracelet-p3', 'bracelet-p4']} />
        </Section>

        <Section id="gap" kicker="gap-kicker" heading="gap-heading" className="alt">
          <Prose ids={['gap-p1', 'gap-p2', 'gap-p3']} />
        </Section>

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
            <Prose ids={['j2-p1']} />
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
          <div className="container" style={{ padding: 0 }}>
            <Prose ids={['j3-demo-lead']} />
          </div>
          <SoundscapeDemo />
          <figcaption>
            <T id="j3-demo-caption" field="caption" />
          </figcaption>
          <div className="container" style={{ padding: 0, marginTop: 26 }}>
            <Prose ids={['j3-payoff']} />
          </div>
        </Section>

        <Section id="engine" kicker="engine-kicker" heading="engine-heading" className="alt" wide>
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
            <Prose ids={['engine-p2', 'engine-p3']} />
          </div>
          <div className="shot-pair">
            <Shot src={shotWorkspace} captionId="engine-workspace-caption" />
            <Shot src={shotCommentaries} captionId="engine-commentaries-caption" />
          </div>
        </Section>

        <Section id="trust" kicker="trust-kicker" heading="trust-heading" wide>
          <div className="container" style={{ padding: 0 }}>
            <Prose ids={['trust-p1', 'trust-p2']} />
          </div>
          <Shot src={shotCoach} captionId="trust-caption" />
        </Section>

        <Section id="roadmap" kicker="roadmap-kicker" heading="roadmap-heading" className="alt">
          <Prose ids={['roadmap-p1']} />
          <ol className="timeline">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <li key={n}>
                <span className="dot" aria-hidden="true" />
                <T id={`roadmap-step${n}`} field="label" as="span" className="t-label" />
                <T id={`roadmap-step${n}`} field="text" as="span" className="t-text" />
              </li>
            ))}
          </ol>
          <Prose ids={['roadmap-p2']} />
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
          <Prose ids={['model-p1', 'model-p2']} />
        </Section>

        <Section id="interop" kicker="interop-kicker" heading="interop-heading">
          <Prose ids={['interop-p1', 'interop-p2', 'interop-p3']} />
        </Section>

        <Section id="about" heading="about-heading" className="dark">
          <Prose ids={['about-p1', 'about-p2']} />
          <a className="about-contact" href={`mailto:${t('about-contact', 'label')}`}>
            <T id="about-contact" field="label" />
          </a>
        </Section>

        <footer className="footer">
          Origo · a personal project of Joshua Frost, SIL International · screenshots and demo data
          are the working system, unedited
        </footer>
      </main>
      <DevFeedbackRoot />
    </>
  )
}
