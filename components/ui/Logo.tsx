interface LogoProps {
  className?: string
  /** Kept for call-site compatibility; every variant renders the SVG mark. */
  variant?: 'mark' | 'full' | 'auto'
  priority?: boolean
  /** Set when a visible "Democracy Unlocked" wordmark sits next to the mark,
   *  so screen readers don't hear the name twice. */
  decorative?: boolean
}

/**
 * Brand mark: a padlock whose shackle is the Capitol dome, drawn as one solid
 * silhouette (lantern, dome, cornice) standing on two legs that drop into the
 * lock body. No thin strokes, so it holds down to favicon sizes and never
 * reads as bars. Same drawing as the landing hero's lock
 * (components/landing/KeyLock.tsx); app/icon.svg is a bolder 16px cut of it.
 *
 * Everything paints in currentColor and the keyhole is cut out of the body
 * (evenodd), so the mark works on navy and white headers alike without ids.
 */
export const DOME_SHACKLE_PATH =
  'M22.6 6V3.8L24 1.6l1.4 2.2V6z' + // lantern
  'M14 16.6C14 10.2 18.4 5.8 24 5.8s10 4.4 10 10.8z' + // dome
  'M13 16h22a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z' + // cornice
  'M13 18.5h4V31h-4zM31 18.5h4V31h-4z' // shackle legs (open gap above the body)

export const KEYHOLE_PATH =
  'M24 30a3 3 0 0 0-1.6 5.54L21.6 40.5h4.8l-.8-4.96A3 3 0 0 0 24 30z'

export default function Logo({ className = 'w-7 h-7', decorative = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...(decorative
        ? { 'aria-hidden': true, focusable: false }
        : { role: 'img', 'aria-label': 'Democracy Unlocked' })}
    >
      <path d={DOME_SHACKLE_PATH} fill="currentColor" />
      {/* body with the keyhole cut through */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={'M9.5 26h29a3 3 0 0 1 3 3v12.5a3 3 0 0 1-3 3h-29a3 3 0 0 1-3-3V29a3 3 0 0 1 3-3z' + KEYHOLE_PATH}
      />
    </svg>
  )
}
