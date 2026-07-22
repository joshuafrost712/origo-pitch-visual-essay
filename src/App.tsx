import { DevFeedbackRoot } from './devfeedback/DevFeedbackRoot'
import { T } from './components/T'

export function App() {
  return (
    <>
      <main className="essay">
        <T id="hero-title" field="heading" as="h1" />
        <T id="hero-tagline" field="text" as="p" />
      </main>
      <DevFeedbackRoot />
    </>
  )
}
