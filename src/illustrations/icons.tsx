import type { TabRoute } from '../lib/router'

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Small line icon for each tab, stroke = currentColor so it inherits nav ink. */
export function TabIcon({ route }: { route: TabRoute }) {
  switch (route) {
    case 'story': // open book
      return (
        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
          <path {...common} d="M12 6c-2-1.7-4.6-2-7-2v14c2.4 0 5 .3 7 2 2-1.7 4.6-2 7-2V4c-2.4 0-5 .3-7 2Zm0 0v14" />
        </svg>
      )
    case 'work': // magnifier
      return (
        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
          <circle {...common} cx="10.5" cy="10.5" r="6" />
          <path {...common} d="m15.5 15.5 4.5 4.5" />
        </svg>
      )
    case 'engine': // database
      return (
        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
          <ellipse {...common} cx="12" cy="6" rx="7" ry="3" />
          <path {...common} d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
        </svg>
      )
    case 'road': // waypoint path
      return (
        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
          <path {...common} d="M5 19c6 0 4-10 10-10" />
          <circle {...common} cx="5" cy="19" r="2" />
          <circle {...common} cx="17.5" cy="7.5" r="3" />
        </svg>
      )
    case 'quality': // checked shield
      return (
        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
          <path {...common} d="M12 3l7 2.5v6c0 4-3 7.2-7 9.5-4-2.3-7-5.5-7-9.5v-6L12 3Z" />
          <path {...common} d="m9 11.8 2.2 2.2L15.4 9.8" />
        </svg>
      )
    default: // together: linked rings
      return (
        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
          <circle {...common} cx="9" cy="12" r="5" />
          <circle {...common} cx="15" cy="12" r="5" />
        </svg>
      )
  }
}
