interface LogoProps {
  className?: string
  /** When true, render in monochrome using `currentColor` (good for nav/footer).
   *  When false, render with the brand's filled-color treatment (navy body,
   *  white keyhole) — good for a "logo card" on hero / about pages. */
  mono?: boolean
}

/**
 * Democracy Unlocked logo — Capitol dome as a padlock shackle.
 *
 * The dome arches up from the top of the lock body, with a small spire
 * (Statue of Freedom) at the peak. A keyhole on the body completes the
 * metaphor — institutional power, made openable.
 *
 * 24×24 viewBox; scales cleanly from a 16-px favicon to a hero illustration.
 */
export default function Logo({ className = 'w-6 h-6', mono = false }: LogoProps) {
  const bodyFill = mono ? 'currentColor' : 'var(--accent)'           // navy when colored
  const keyhole  = mono ? 'var(--surface)' : 'var(--surface)'        // always cut out

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Democracy Unlocked logo"
    >
      {/* ── Capitol structure (stays as outline strokes; the "shackle") ── */}

      {/* Spire / Statue of Freedom — tiny dot + vertical line */}
      <circle cx="12" cy="2.5" r="0.65" fill={bodyFill} />
      <line x1="12" y1="3.1" x2="12" y2="4.6"
        stroke={bodyFill} strokeWidth="1.4" strokeLinecap="round" />

      {/* Lantern — small horizontal bar under the spire */}
      <line x1="10.5" y1="4.8" x2="13.5" y2="4.8"
        stroke={bodyFill} strokeWidth="1.4" strokeLinecap="round" />

      {/* Dome arc — the half-circle that doubles as a padlock shackle */}
      <path d="M 6.5 10.5 V 9 A 5.5 5.5 0 0 1 17.5 9 V 10.5"
        stroke={bodyFill} strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* Two dome ribs to hint at column structure */}
      <line x1="9.3" y1="5.7" x2="9.3" y2="10.5"
        stroke={bodyFill} strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      <line x1="14.7" y1="5.7" x2="14.7" y2="10.5"
        stroke={bodyFill} strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />

      {/* ── Lock body (filled rounded rect — the padlock body) ── */}
      <rect x="4.5" y="10.5" width="15" height="11" rx="2"
        fill={bodyFill} stroke={bodyFill} strokeWidth="1.2" strokeLinejoin="round" />

      {/* Keyhole — circle + tapered shaft, cut out of the body */}
      <circle cx="12" cy="14.5" r="1.4" fill={keyhole} />
      <path d="M 11.25 14.5 L 11.6 18.2 L 12.4 18.2 L 12.75 14.5 Z" fill={keyhole} />
    </svg>
  )
}
