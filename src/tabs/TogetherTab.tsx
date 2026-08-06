import { Section, Prose } from '../components/Section'
import { T, t } from '../components/T'
import { TabHero } from '../components/TabHero'
import { SignupForm } from '../components/SignupForm'

export function TogetherTab() {
  return (
    <>
      <TabHero id="tab-together" />

      <Section id="interop" kicker="interop-kicker" heading="interop-heading">
        <Prose ids={['interop-p1', 'interop-p2', 'interop-p3']} />
      </Section>

      {/* The last tab is where a persuaded reader actually arrives, and the
          about-contact mailto sits just below: close enough to reinforce this,
          far enough not to compete with it. */}
      <Section id="involved" kicker="involved-kicker" heading="involved-heading" className="alt">
        <Prose ids={['involved-p1']} />
        <div className="su-offers">
          {['updates', 'beta'].map((kind) => (
            <div className="su-offer" key={kind}>
              <T id={`involved-${kind}`} field="label" as="span" className="su-offer__title" />
              <T id={`involved-${kind}`} field="text" as="p" />
            </div>
          ))}
        </div>
        <SignupForm />
      </Section>

      <Section id="about" heading="about-heading" className="dark">
        <Prose ids={['about-p1', 'about-p2']} />
        <a className="about-contact" href={`mailto:${t('about-contact', 'label')}`}>
          <T id="about-contact" field="label" />
        </a>
      </Section>
    </>
  )
}
