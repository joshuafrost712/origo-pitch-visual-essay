import { Suspense, lazy } from 'react'
import { TopNav } from './components/TopNav'
import { Pager } from './components/Pager'
import { useHashRoute, type TabRoute } from './lib/router'
import { StoryTab } from './tabs/StoryTab'
import { WorkTab } from './tabs/WorkTab'
import { EngineTab } from './tabs/EngineTab'
import { QualityTab } from './tabs/QualityTab'
import { RoadTab } from './tabs/RoadTab'
import { TogetherTab } from './tabs/TogetherTab'

/**
 * The dev-feedback tools are kept OUT of the production bundle entirely, not
 * merely switched off inside it.
 *
 * `import.meta.env.DEV` is replaced with the literal `false` at build time, so
 * this ternary constant-folds to `null` and the dynamic import inside the dead
 * branch is dropped along with the whole `src/devfeedback` tree. That matters
 * now the essay is public: the tools post to a `vite dev` endpoint that does not
 * exist in a build, and their comment store has no business being reachable by
 * a reader. It also means the old `?dev=1` escape hatch reaches nothing in a
 * deployed build; run `npm run dev` locally to get the tools back.
 */
const DevFeedbackRoot = import.meta.env.DEV
  ? lazy(() =>
      import('./devfeedback/DevFeedbackRoot').then((m) => ({ default: m.DevFeedbackRoot })),
    )
  : null

const TAB_VIEWS: Record<TabRoute, () => React.ReactNode> = {
  story: StoryTab,
  work: WorkTab,
  engine: EngineTab,
  quality: QualityTab,
  road: RoadTab,
  together: TogetherTab,
}

export function App() {
  const route = useHashRoute()
  const View = TAB_VIEWS[route]
  return (
    <>
      <TopNav route={route} />
      <main className="essay">
        {/* keyed on route so a tab switch remounts + replays the entry animation */}
        <div className="tab-panel" key={route}>
          <View />
          <Pager route={route} />
        </div>
      </main>
      <footer className="footer">
        Origo · a personal project of Joshua Frost, SIL International · screenshots and demo data
        are the working system, unedited · manuscript photography via Wikimedia Commons
        (public domain / CC0)
      </footer>
      {DevFeedbackRoot && (
        <Suspense fallback={null}>
          <DevFeedbackRoot />
        </Suspense>
      )}
    </>
  )
}
