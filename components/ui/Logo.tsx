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
 * Brand mark: a padlock whose shackle is the Capitol dome — lantern on top,
 * colonnade showing between the legs. Same drawing as the landing hero's lock
 * (components/landing/KeyLock.tsx) and the favicon (app/icon.svg).
 *
 * Everything paints in currentColor, and the keyhole is cut out of the body
 * (evenodd) rather than painted a fixed colour, so the mark works on the navy
 * landing header and the white dashboard/legal headers alike.
 */
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
      {/* lantern */}
      <path d="M24 2.5v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="21.5" y="5.5" width="5" height="3" rx="1" fill="currentColor" />
      {/* dome shackle + colonnade */}
      <path d="M11.5 24v-5c0-6.8 5.6-11 12.5-11s12.5 4.2 12.5 11v5"
        stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M18 14.5V24M24 12.5V24M30 14.5V24"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      {/* body with the keyhole cut through */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M9.5 23.5h29a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3h-29a3 3 0 0 1-3-3v-15a3 3 0 0 1 3-3z
           M24 28.5a3 3 0 0 0-1.55 5.57L21.7 39.5h4.6l-.75-5.43A3 3 0 0 0 24 28.5z"
      />
    </svg>
  )
}
