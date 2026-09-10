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
 * Brand mark: padlock body with the Capitol dome arching as the shackle.
 *
 * This used to try /logo-mark.png first and fall back to this SVG on error.
 * The PNG was never committed, so every page load made two failing image
 * requests (400 from /_next/image), and because the error fired before
 * hydration the onError fallback often never ran — leaving an empty <img>
 * with no alt text. The SVG is now the logo. If a raster asset is added later
 * (scripts/prepare-logo.py), reintroduce it deliberately.
 */
export default function Logo({ className = 'w-7 h-7', decorative = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...(decorative
        ? { 'aria-hidden': true, focusable: false }
        : { role: 'img', 'aria-label': 'Democracy Unlocked' })}
    >
      <circle cx="12" cy="2.5" r="0.65" fill="currentColor" />
      <line x1="12" y1="3.1" x2="12" y2="4.6"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="10.5" y1="4.8" x2="13.5" y2="4.8"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 6.5 10.5 V 9 A 5.5 5.5 0 0 1 17.5 9 V 10.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <line x1="9.3" y1="5.7" x2="9.3" y2="10.5"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      <line x1="14.7" y1="5.7" x2="14.7" y2="10.5"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      <rect x="4.5" y="10.5" width="15" height="11" rx="2"
        fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="12" cy="14.5" r="1.4" fill="white" />
      <path d="M 11.25 14.5 L 11.6 18.2 L 12.4 18.2 L 12.75 14.5 Z" fill="white" />
    </svg>
  )
}
