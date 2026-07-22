import { useEffect, type RefObject } from 'react'

/** Gentle scroll parallax on a backdrop element. No-op under
 *  prefers-reduced-motion; one rAF-throttled listener per element. */
export function useParallax(ref: RefObject<HTMLElement | null>, factor = 0.22, scale = 1.12) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `translateY(${window.scrollY * factor}px) scale(${scale})`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [ref, factor, scale])
}
