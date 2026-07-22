import { useEffect, useRef, useState } from 'react'

const fmt = new Intl.NumberFormat('en-US')

/**
 * Animated count-up stat number. Starts when scrolled into view; renders the
 * final value immediately under prefers-reduced-motion.
 */
export function Counter({ value, approx = false }: { value: number; approx?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        if (reduced) {
          setDisplay(value)
          return
        }
        const t0 = performance.now()
        const dur = 1400
        const tick = (t: number) => {
          const k = Math.min(1, (t - t0) / dur)
          const eased = 1 - Math.pow(1 - k, 3)
          setDisplay(Math.round(value * eased))
          if (k < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value])

  const text =
    value >= 1_000_000
      ? `${(display / 1_000_000).toFixed(2)}M`
      : fmt.format(display)

  return (
    <span ref={ref} className="num">
      {approx ? '~' : ''}
      {text}
    </span>
  )
}
