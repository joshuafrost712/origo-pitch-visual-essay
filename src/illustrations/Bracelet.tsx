/**
 * The black/orange/red bead bracelet from the opening story, drawn as a loose
 * hand-tied loop. Bead positions are precomputed on an ellipse with a small
 * deterministic wobble so it reads as handmade, not geometric.
 */
const COLORS = ['#23201d', '#d9822b', '#b03a2e'] as const

const BEADS = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2
  const wobble = Math.sin(i * 2.7) * 4 + Math.cos(i * 1.3) * 3
  const rx = 118 + wobble
  const ry = 86 + wobble * 0.7
  return {
    x: 160 + Math.cos(a) * rx,
    y: 110 + Math.sin(a) * ry,
    r: 10.5 + Math.sin(i * 1.9) * 1.4,
    c: COLORS[i % 3],
  }
})

export function Bracelet({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={`bracelet-svg ${className}`}
      role="img"
      aria-label="A bracelet of black, orange, and red beads"
    >
      {/* cord */}
      <ellipse cx="160" cy="110" rx="118" ry="86" fill="none" stroke="#8a7a5f" strokeWidth="2.5" opacity="0.55" />
      {/* knot tails */}
      <path d="M 278 110 q 14 6 20 18 M 278 110 q 16 -2 24 6" fill="none" stroke="#8a7a5f" strokeWidth="2.5" opacity="0.55" strokeLinecap="round" />
      {BEADS.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={b.r} fill={b.c} />
          <circle cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.35} r={b.r * 0.28} fill="#ffffff" opacity="0.35" />
        </g>
      ))}
    </svg>
  )
}
