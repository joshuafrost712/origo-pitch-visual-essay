import { useEffect, useRef } from 'react'
import { TABS, hashFor, type TabRoute } from '../lib/router'
import { TabIcon } from '../illustrations/icons'
import { T } from './T'

/** Sticky slate nav: wordmark, five tab links with an active underline,
 *  and a thin teal reading-progress bar along the bottom edge. */
export function TopNav({ route }: { route: TabRoute }) {
  const barRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = barRef.current
        if (!el) return
        const max = document.documentElement.scrollHeight - window.innerHeight
        const k = max > 0 ? Math.min(1, window.scrollY / max) : 0
        el.style.transform = `scaleX(${k})`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [route])

  // keep the active link visible when the nav row scrolls horizontally (mobile)
  useEffect(() => {
    const active = navRef.current?.querySelector('.nav-link.active')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [route])

  return (
    <div className="topnav">
      <div className="topnav-inner">
        <a className="brand" href={hashFor('story')}>
          Ori<span>go</span>
        </a>
        <nav ref={navRef} className="nav-links" aria-label="Essay sections">
          {TABS.map((tab) => (
            <a
              key={tab.route}
              href={hashFor(tab.route)}
              className={`nav-link ${tab.route === route ? 'active' : ''}`}
              aria-current={tab.route === route ? 'page' : undefined}
            >
              <TabIcon route={tab.route} />
              <T id={tab.navId} field="label" />
            </a>
          ))}
        </nav>
      </div>
      <div className="nav-progress" aria-hidden="true">
        <div ref={barRef} className="nav-progress-fill" />
      </div>
    </div>
  )
}
