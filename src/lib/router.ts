import { useEffect, useState } from 'react'

/** The essay's six tabs, in reading order. Routes are hash-based
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
  { route: 'together', navId: 'nav-together' },
] as const

export type TabRoute = (typeof TABS)[number]['route']

export function parseHash(): TabRoute {
  const h = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '')
  return (TABS.some((t) => t.route === h) ? h : 'story') as TabRoute
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
