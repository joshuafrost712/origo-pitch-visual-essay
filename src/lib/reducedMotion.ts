import { useEffect, useState } from 'react'

/**
 * Does this reader want motion suppressed?
 *
 * The vision scenes need this in JS, not only in CSS. Their animated end state
 * on the "before" lane is *nothing at all* (the notes scatter and are gone), so
 * simply switching the animation off would leave an empty box where the whole
 * point of the panel should be. Each scene therefore renders a genuinely
 * different static frame: the dashed ghosts already present on the left, the
 * paths already drawn on the right. Same reasoning as cairn's welcome scenes.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
