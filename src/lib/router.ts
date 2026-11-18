import { useEffect, useState } from 'react'

/** The essay's tabs, in reading order. Routes are hash-based
 *  (#/story … #/together) so GitHub Pages needs no server rewrites.
 *  Quality sits directly after the engine: it answers the question the engine
 *  raises ("why should I believe what it returns?"), so it reads as the second
 *  half of that argument rather than as an appendix. */
export const TABS = [
  { route: 'story', navId: 'nav-story' },
  { route: 'work', navId: 'nav-work' },
  { route: 'engine', navId: 'nav-engine' },
  { route: 'quality', navId: 'nav-quality' },
  { route: 'road', navId: 'nav-road' },
  { route: 'recommendations', navId: 'nav-recommendations' },
  { route: 'together', navId: 'nav-together' },
] as const

export type TabRoute = (typeof TABS)[number]['route']

/** Tabs shown in the nav and the prev/next pager. A tab with `listed: false`
 *  still renders at its own URL, so it can be shared by direct link before it
 *  joins the nav. Recommendations is unlisted until Joshua confirms the
 *  headshots (2026-11-18); set `listed` true (or delete it) to publish it. */
export const NAV_TABS = TABS.filter((t) => !('listed' in t) || t.listed !== false)

/** The hash path split into segments: '#/recommendations/marcia-suzuki'
 *  gives ['recommendations', 'marcia-suzuki']. Only the first segment picks the
 *  tab; a second segment is a detail id the tab may read with useHashParam. */
function hashSegments(): string[] {
  return window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '').split('/')
}

export function parseHash(): TabRoute {
  const h = hashSegments()[0]
  return (TABS.some((t) => t.route === h) ? h : 'story') as TabRoute
}

/** The detail id after the tab segment, or undefined on the tab's own page. */
export function parseHashParam(): string | undefined {
  return hashSegments()[1] || undefined
}

export function useHashParam(): string | undefined {
  const [param, setParam] = useState<string | undefined>(parseHashParam)
  useEffect(() => {
    const onHash = () => setParam(parseHashParam())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return param
}

export function hashFor(route: TabRoute): string {
  return `#/${route}`
}

export function useHashRoute(): TabRoute {
  const [route, setRoute] = useState<TabRoute>(parseHash)
  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}
