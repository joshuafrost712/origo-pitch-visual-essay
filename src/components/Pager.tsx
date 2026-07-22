import { TABS, hashFor, type TabRoute } from '../lib/router'
import { T } from './T'

/** Prev/next links at the foot of each tab so the essay still reads
 *  front-to-back as one guided flow. */
export function Pager({ route }: { route: TabRoute }) {
  const i = TABS.findIndex((t) => t.route === route)
  const prev = i > 0 ? TABS[i - 1] : null
  const next = i < TABS.length - 1 ? TABS[i + 1] : null
  return (
    <nav className="pager" aria-label="Continue reading">
      {prev ? (
        <a className="pager-link prev" href={hashFor(prev.route)}>
          <span className="dir">Back</span>
          <span className="dest">
            ← <T id={prev.navId} field="label" />
          </span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a className="pager-link next" href={hashFor(next.route)}>
          <span className="dir">Next</span>
          <span className="dest">
            <T id={next.navId} field="label" /> →
          </span>
        </a>
      )}
    </nav>
  )
}
