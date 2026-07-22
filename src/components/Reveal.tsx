import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Fade-and-rise wrapper driven by IntersectionObserver; inert under reduced motion (CSS). */
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`}>
      {children}
    </div>
  )
}
