import { Section, Prose } from '../components/Section'
import { T, t } from '../components/T'
import { TabHero } from '../components/TabHero'

export function TogetherTab() {
  return (
    <>
      <TabHero id="tab-together" />

      <Section id="interop" kicker="interop-kicker" heading="interop-heading">
        <Prose ids={['interop-p1', 'interop-p2', 'interop-p3']} />
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
