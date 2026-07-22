import { T } from './T'
import { Reveal } from './Reveal'

export function Prose({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id) => (
        <T key={id} id={id} field="text" as="p" />
      ))}
    </>
  )
}

export function Section({
  id,
  kicker,
  heading,
  className = '',
  wide = false,
  children,
}: {
  id: string
  kicker?: string
  heading: string
  className?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`section ${className}`} id={id}>
      <div className={`container ${wide ? 'wide' : ''}`}>
        <Reveal>
          {kicker && <T id={kicker} field="kicker" as="span" className="kicker" />}
          <T id={heading} field="heading" as="h2" />
          {children}
        </Reveal>
      </div>
    </section>
  )
}
