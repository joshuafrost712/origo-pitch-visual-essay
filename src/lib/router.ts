import { useEffect, useState } from 'react'

/** The essay's five tabs, in reading order. Routes are hash-based
 *  (#/story … #/together) so GitHub Pages needs no server rewrites. */
export const TABS = [
  { route: 'story', navId: 'nav-story' },
  { route: 'work', navId: 'nav-work' },
  { route: 'engine', navId: 'nav-engine' },
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
