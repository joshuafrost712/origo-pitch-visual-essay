import { DevFeedbackRoot } from './devfeedback/DevFeedbackRoot'
import { TopNav } from './components/TopNav'
import { Pager } from './components/Pager'
import { useHashRoute, type TabRoute } from './lib/router'
import { StoryTab } from './tabs/StoryTab'
import { WorkTab } from './tabs/WorkTab'
import { EngineTab } from './tabs/EngineTab'
import { RoadTab } from './tabs/RoadTab'
import { TogetherTab } from './tabs/TogetherTab'

const TAB_VIEWS: Record<TabRoute, () => React.ReactNode> = {
  story: StoryTab,
  work: WorkTab,
  engine: EngineTab,
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
      <DevFeedbackRoot />
    </>
  )
}
