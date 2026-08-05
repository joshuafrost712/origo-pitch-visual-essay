import { Book, Card, Chip, Flow, Person, Store, TextLine } from './sceneParts'

/**
 * The four before/after figures, one pair per vision scene.
 *
 * Every pair obeys the same grammar: the LEFT lane is muted and dashed and ends
 * with nothing compiled, the RIGHT lane is accent-tinted and ends with filled
 * elements flowing into a result. Both lanes take `animated` from one shared
 * trigger in `VisionScene`, so the notes scatter on the left in the same beat
 * they land on the right. Two animations that merely happen to sit near each
 * other are not a contrast.
 *
 * `animated === false` is not the animated end state with the motion removed:
 * on the left lane that end state is an empty box. It is the strongest single
 * frame instead, which is the dashed ghosts already present beside the filled
 * result.
 */

const VB = '0 0 300 200'

/* ------------------------------------------------------------------ scene 1
   The research gap: two dictionaries and a dozen databases, against one
   collated corpus that answers the cultural question as well as the lexical. */

const S1_NOTES = [
  { y: 24, dx: 40, dy: -18 },
  { y: 66, dx: 46, dy: 12 },
  { y: 108, dx: 34, dy: 26 },
  { y: 150, dx: 44, dy: 20 },
]

export function Scene1Before({ animated }: { animated: boolean }) {
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      <Person x={26} y={100} />
      <Book x={48} y={54} />
      <Book x={66} y={54} />
      {S1_NOTES.map((n, i) => (
        <Chip
          key={`c${i}`}
          x={100}
          y={n.y}
          tone={animated ? 'kept' : 'lost'}
          anim={animated ? 'vs-scatter' : undefined}
          delay={0.1 + i * 0.16}
          dx={n.dx}
          dy={n.dy}
        />
      ))}
      {/* The residue, so the animated lane ends where the static lane starts:
          dashed ghosts of the notes rather than a blank rectangle. */}
      {animated && (
        <g className="vs-ghosts vs-fade" style={{ animationDelay: '1.5s' }}>
          {S1_NOTES.map((n, i) => (
            <Chip key={`g${i}`} x={100} y={n.y} tone="lost" />
          ))}
        </g>
      )}
      <Card x={200} y={71} cells={0} empty />
    </svg>
  )
}

export function Scene1After({ animated }: { animated: boolean }) {
  const slots = [46, 86, 126]
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      <Person x={26} y={100} />
      <Store x={52} y={74} anim={animated ? 'vs-fade' : undefined} delay={0.1} />
      {slots.map((y, i) => (
        <Flow
          key={`p${i}`}
          d={`M 100 ${100} C 116 ${100} 118 ${y + 9} 130 ${y + 9}`}
          anim={animated}
          delay={0.3 + i * 0.14}
        />
      ))}
      {slots.map((y, i) => (
        <Chip
          key={`c${i}`}
          x={132}
          y={y}
          tone="confirmed"
          anim={animated ? 'vs-arrive' : undefined}
          delay={0.5 + i * 0.14}
          dx={-32}
          dy={100 - y - 9}
        />
      ))}
      <line x1={186} y1={34} x2={186} y2={166} className="vs-gate" />
      <Card
        x={200}
        y={64}
        w={86}
        h={72}
        cells={2}
        anim={animated ? 'vs-fade' : undefined}
        delay={1.05}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ scene 2
   Research briefs: hours of gathering before the thinking starts, against a
   brief that gathers for you and leaves the reading where it belongs. */

const S2_STACK = [12, 40, 68, 96, 124, 152]

export function Scene2Before({ animated }: { animated: boolean }) {
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      <line x1={30} y1={10} x2={30} y2={186} className="vs-clock" />
      {S2_STACK.map((y, i) => (
        <Chip
          key={`c${i}`}
          x={44}
          y={y}
          w={64}
          tone={animated ? 'kept' : 'lost'}
          anim={animated ? 'vs-pile' : undefined}
          delay={0.08 + i * 0.13}
        />
      ))}
      {animated && (
        <g className="vs-ghosts vs-fade" style={{ animationDelay: '1.45s' }}>
          {S2_STACK.map((y, i) => (
            <Chip key={`g${i}`} x={44} y={y} w={64} tone="lost" />
          ))}
        </g>
      )}
      <Card x={196} y={71} cells={0} empty />
    </svg>
  )
}

export function Scene2After({ animated }: { animated: boolean }) {
  const slots = [56, 96, 136]
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      {/* The brief: written first, and the only instruction in the picture. */}
      <Card
        x={12}
        y={14}
        w={74}
        h={40}
        cells={0}
        anim={animated ? 'vs-fade' : undefined}
        delay={0.06}
      />
      {slots.map((y, i) => (
        <Flow
          key={`p${i}`}
          d={`M 50 58 C 50 ${y} 78 ${y + 9} 106 ${y + 9}`}
          anim={animated}
          delay={0.26 + i * 0.13}
        />
      ))}
      {slots.map((y, i) => (
        <Chip
          key={`c${i}`}
          x={108}
          y={y}
          tone="confirmed"
          anim={animated ? 'vs-arrive' : undefined}
          delay={0.46 + i * 0.13}
          dx={-56}
          dy={40 - y}
        />
      ))}
      <line x1={168} y1={20} x2={168} y2={180} className="vs-gate" />
      <Card x={182} y={26} w={102} h={62} cells={3} anim={animated ? 'vs-fade' : undefined} delay={1.0} />
      <Card x={182} y={110} w={102} h={62} cells={3} anim={animated ? 'vs-fade' : undefined} delay={1.16} />
    </svg>
  )
}

/* ------------------------------------------------------------------ scene 3
   Artistry: told that it is there, against shown where it is, how strong it
   is, and what it sounds like in the language the team is working in. */

const S3_LINES: Array<{ y: number; w: number; mark: [number, number] }> = [
  { y: 44, w: 148, mark: [86, 40] },
  { y: 78, w: 132, mark: [18, 34] },
  { y: 112, w: 152, mark: [104, 36] },
  { y: 146, w: 120, mark: [40, 30] },
]

export function Scene3Before({ animated }: { animated: boolean }) {
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      {S3_LINES.map((l, i) => (
        <TextLine key={i} x={16} y={l.y} w={l.w} />
      ))}
      {/* A commentary sentence asserting artistry, with nothing marked on the
          text. Dashed because an assertion is not a record of where. */}
      <Chip
        x={200}
        y={86}
        w={84}
        h={26}
        tone={animated ? 'kept' : 'lost'}
        anim={animated ? 'vs-scatter' : undefined}
        delay={0.2}
        dx={10}
        dy={-8}
      />
      {animated && (
        <g className="vs-ghosts vs-fade" style={{ animationDelay: '1.5s' }}>
          <Chip x={200} y={86} w={84} h={26} tone="lost" />
        </g>
      )}
    </svg>
  )
}

export function Scene3After({ animated }: { animated: boolean }) {
  const slots = [22, 60, 98]
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      {S3_LINES.map((l, i) => (
        <TextLine
          key={i}
          x={12}
          y={l.y}
          w={l.w - 14}
          marked={[l.mark[0] - 8, l.mark[1]]}
          anim={animated ? 'vs-mark' : undefined}
          delay={0.12 + i * 0.12}
        />
      ))}
      {slots.map((y, i) => (
        <Flow
          key={`p${i}`}
          d={`M ${S3_LINES[i].mark[0] + 8} ${S3_LINES[i].y} C ${160} ${S3_LINES[i].y} ${168} ${y + 9} ${186} ${y + 9}`}
          anim={animated}
          delay={0.5 + i * 0.12}
        />
      ))}
      {slots.map((y, i) => (
        <Chip
          key={`c${i}`}
          x={188}
          y={y}
          w={96}
          tone="confirmed"
          anim={animated ? 'vs-arrive' : undefined}
          delay={0.68 + i * 0.12}
          dx={-24}
          dy={0}
        />
      ))}
      {/* The comparable examples, rendered in the team's own language. */}
      <Card x={188} y={136} w={96} h={50} cells={2} anim={animated ? 'vs-fade' : undefined} delay={1.15} />
    </svg>
  )
}

/* ------------------------------------------------------------------ scene 4
   Team infrastructure: one laptop's memory, against a shared verse-keyed store
   that keeps the exegetical trail attached to the decision. */

const S4_PEOPLE = [42, 100, 158]

export function Scene4Before({ animated }: { animated: boolean }) {
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      <Person x={30} y={100} />
      <Flow d="M 46 100 H 82" dashed />
      <Chip
        x={86}
        y={91}
        w={56}
        tone={animated ? 'kept' : 'lost'}
        anim={animated ? 'vs-scatter' : undefined}
        delay={0.16}
        dx={26}
        dy={-14}
      />
      {animated && (
        <g className="vs-ghosts vs-fade" style={{ animationDelay: '1.45s' }}>
          <Chip x={86} y={91} w={56} tone="lost" />
        </g>
      )}
      {/* The decision still gets made. It just arrives with no trail behind it. */}
      <Card x={196} y={71} cells={0} empty />
    </svg>
  )
}

export function Scene4After({ animated }: { animated: boolean }) {
  return (
    <svg viewBox={VB} className="vs-lane__svg" role="presentation">
      {S4_PEOPLE.map((y, i) => (
        <Person key={`u${i}`} x={24} y={y} r={10} />
      ))}
      {S4_PEOPLE.map((y, i) => (
        <Flow
          key={`p${i}`}
          d={`M 38 ${y} C 66 ${y} 74 100 104 100`}
          anim={animated}
          delay={0.18 + i * 0.12}
        />
      ))}
      {/* The two loaded sketches feeding the same store. */}
      <Chip x={92} y={10} w={40} h={16} tone="confirmed" anim={animated ? 'vs-fade' : undefined} delay={0.62} />
      <Chip x={138} y={10} w={40} h={16} tone="confirmed" anim={animated ? 'vs-fade' : undefined} delay={0.72} />
      <Flow d="M 112 28 V 66" anim={animated} delay={0.8} />
      <Flow d="M 158 28 V 66" anim={animated} delay={0.86} />
      <Store x={108} y={68} w={62} h={64} anim={animated ? 'vs-fade' : undefined} delay={0.42} />
      <Flow d="M 170 100 H 196" anim={animated} delay={1.0} />
      <Card x={200} y={68} w={86} h={66} cells={3} anim={animated ? 'vs-fade' : undefined} delay={1.14} />
    </svg>
  )
}
