/**
 * Shared vocabulary for the before/after vision scenes.
 *
 * Ported from the scene grammar in cairn's welcome tour and restyled in the
 * essay's own parchment/serif tokens. Two rules travel with it:
 *
 *   1. A DASH MEANS "this is not a real record." Nothing else in the essay is
 *      drawn dashed, so the dash carries meaning rather than decoration: a
 *      dashed chip is a note that was never written down, a dashed card is a
 *      result there was no evidence to compile.
 *   2. Chips are textless. At this scale invented sample text would be both
 *      unreadable and misleading (it would look like real evidence), so the two
 *      rules stand in for writing and the prose beside the figure carries the
 *      meaning.
 *
 * Animation is CSS, not `motion`: the two-lane beat needs a shared trigger and
 * staggered delays, both of which a class plus `animation-delay` gives, and the
 * essay does not need another 40kB of runtime to get it.
 */

export type Tone = 'kept' | 'lost' | 'confirmed'

interface ChipProps {
  x: number
  y: number
  tone?: Tone
  w?: number
  h?: number
  /** Animation class, e.g. `vs-scatter` / `vs-arrive`. Omitted for a static frame. */
  anim?: string
  delay?: number
  /** Translation applied by the scatter keyframes, in viewBox units. */
  dx?: number
  dy?: number
}

/** One note, as a small rounded card with two rules where writing would be. */
export function Chip({ x, y, tone = 'kept', w = 42, h = 18, anim, delay = 0, dx = 0, dy = 0 }: ChipProps) {
  return (
    <g
      className={`vs-chip vs-chip--${tone} ${anim ?? ''}`}
      style={
        anim
          ? ({ animationDelay: `${delay}s`, '--dx': `${dx}px`, '--dy': `${dy}px` } as React.CSSProperties)
          : undefined
      }
    >
      <rect x={x} y={y} width={w} height={h} rx={5} className="vs-chip__body" />
      <rect x={x + 6} y={y + 5} width={w - 15} height={2} rx={1} className="vs-chip__rule" />
      <rect x={x + 6} y={y + 10} width={w - 23} height={2} rx={1} className="vs-chip__rule" />
    </g>
  )
}

interface FlowProps {
  d: string
  /** Draw itself in. Static renders the same path already drawn. */
  anim?: boolean
  delay?: number
  dashed?: boolean
}

/**
 * The line a note travels along. Animated, it draws itself with a
 * dashoffset transition, which is the one effect that reads as "this went
 * somewhere" rather than "a line appeared". A path is part of the diagram's
 * meaning, so the static branch always shows it fully drawn.
 */
export function Flow({ d, anim, delay = 0, dashed }: FlowProps) {
  return (
    <path
      d={d}
      // pathLength normalises every path to 1 unit so one dashoffset keyframe
      // draws a short line and a long curve at the same rate. Without it each
      // path would need its own measured dasharray.
      pathLength={anim ? 1 : undefined}
      className={`vs-flow ${dashed ? 'vs-flow--dashed' : ''} ${anim ? 'vs-draw' : ''}`}
      style={anim ? { animationDelay: `${delay}s` } : undefined}
    />
  )
}

interface CardProps {
  x: number
  y: number
  w?: number
  h?: number
  /** Number of filled result cells. 0 with `empty` is the "nothing to compile" frame. */
  cells?: number
  empty?: boolean
  anim?: string
  delay?: number
}

/** A compiled result. `empty` is the outline with nothing in it. */
export function Card({ x, y, w = 92, h = 58, cells = 0, empty = false, anim, delay = 0 }: CardProps) {
  const CELL = 20
  const GAP = 5
  return (
    <g
      className={`vs-card ${empty ? 'vs-card--empty' : ''} ${anim ?? ''}`}
      style={anim ? { animationDelay: `${delay}s` } : undefined}
    >
      <rect x={x} y={y} width={w} height={h} rx={7} className="vs-card__body" />
      <rect x={x + 9} y={y + 11} width={Math.min(42, w - 26)} height={4} rx={2} className="vs-card__title" />
      {Array.from({ length: cells }, (_, i) => (
        <rect
          key={i}
          x={x + 9 + i * (CELL + GAP)}
          y={y + 24}
          width={CELL}
          height={CELL}
          rx={4}
          className={`vs-card__cell vs-card__cell--${i}`}
        />
      ))}
    </g>
  )
}

/**
 * A person in the scene. Initial-less: a diagram that names people invents them.
 *
 * The shoulders are a FILLED dome, not a stroked arc. Stroked, the arc plus the
 * head above it reads unmistakably as a frowning face, which quietly editorialised
 * every panel it appeared in, including the ones meant to look like good news.
 */
export function Person({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g className="vs-person">
      <circle cx={x} cy={y} r={r} className="vs-person__body" />
      <circle cx={x} cy={y - r * 0.24} r={r * 0.3} className="vs-person__head" />
      <path
        d={`M ${x - r * 0.56} ${y + r * 0.6} Q ${x} ${y + r * 0.04} ${x + r * 0.56} ${y + r * 0.6} Z`}
        className="vs-person__torso"
      />
    </g>
  )
}

/** A book spine: one of the two translation helps within reach. */
export function Book({ x, y, h = 44, w = 13 }: { x: number; y: number; h?: number; w?: number }) {
  return (
    <g className="vs-book">
      <rect x={x} y={y} width={w} height={h} rx={2} className="vs-book__body" />
      <rect x={x + 3} y={y + 6} width={w - 6} height={2} rx={1} className="vs-book__band" />
      <rect x={x + 3} y={y + h - 10} width={w - 6} height={2} rx={1} className="vs-book__band" />
    </g>
  )
}

/** The database glyph, matching the Engine tab's nav icon so the two read as one thing. */
export function Store({ x, y, w = 46, h = 52, anim, delay = 0 }: { x: number; y: number; w?: number; h?: number; anim?: string; delay?: number }) {
  const rx = w / 2
  const ry = 7
  return (
    <g
      className={`vs-store ${anim ?? ''}`}
      style={anim ? { animationDelay: `${delay}s` } : undefined}
    >
      <path
        d={`M ${x} ${y + ry} v ${h - ry * 2} a ${rx} ${ry} 0 0 0 ${w} 0 v ${-(h - ry * 2)}`}
        className="vs-store__body"
      />
      <ellipse cx={x + rx} cy={y + ry} rx={rx} ry={ry} className="vs-store__lid" />
      <path d={`M ${x} ${y + h * 0.42} a ${rx} ${ry} 0 0 0 ${w} 0`} className="vs-store__band" />
      <path d={`M ${x} ${y + h * 0.68} a ${rx} ${ry} 0 0 0 ${w} 0`} className="vs-store__band" />
    </g>
  )
}

/** A line of text, as rules. Used by the artistry scene, where the text is the subject. */
export function TextLine({
  x,
  y,
  w,
  marked,
  anim,
  delay = 0,
}: {
  x: number
  y: number
  w: number
  /** [start, length] of a marked span, in viewBox units, relative to x. */
  marked?: [number, number]
  anim?: string
  delay?: number
}) {
  return (
    <g className="vs-textline">
      <rect x={x} y={y} width={w} height={3} rx={1.5} className="vs-textline__rule" />
      {marked && (
        <rect
          x={x + marked[0]}
          y={y - 1}
          width={marked[1]}
          height={5}
          rx={2.5}
          className={`vs-textline__mark ${anim ?? ''}`}
          style={anim ? { animationDelay: `${delay}s` } : undefined}
        />
      )}
    </g>
  )
}
