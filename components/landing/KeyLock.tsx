'use client'

import { useLayoutEffect, useRef } from 'react'
import { DOME_SHACKLE_PATH, KEYHOLE_PATH } from '@/components/ui/Logo'

/**
 * The landing hero's key and lock. The key's bow is the Capitol dome; each ZIP
 * digit cuts one tooth (blank = uncut, higher digit = deeper cut). On submit
 * the key slides all the way into the lock in one motion; when the lookup
 * succeeds the dome shackle lifts as the key seats.
 *
 * Every tooth is its own rect scaled from the blade edge, so re-cutting eases
 * in all browsers (a single morphing path only animates in some). Timings live
 * in globals.css under `.keylock`.
 */

const TEETH_X = [179, 241, 303, 365, 427] // left edge of each 62-wide tooth
const TOOTH_W = 62
const BLADE_BOTTOM = 112
const FULL = 58 // an uncut tooth's depth below the blade
/** When the shackle starts lifting, measured from the start of the key's travel. */
const SHACKLE_START_S = 0.35

function toothScale(digit: string | undefined): number {
  if (digit == null || !/\d/.test(digit)) return 1
  return (FULL - (Number(digit) + 1) * 5) / FULL
}

/** idle: resting · turning: lookup in flight, key travelling in · unlocked: seated, shackle up */
export type KeyLockState = 'idle' | 'turning' | 'unlocked'

export function keyLockLabel(zip: string, state: KeyLockState, ambiguous = false): string {
  const digits = zip.replace(/\D/g, '').slice(0, 5)
  if (state === 'unlocked') {
    return `The key cut from ZIP ${digits} has opened the Capitol-dome lock. ` +
      (ambiguous ? 'This ZIP spans several districts; choose yours below.' : 'Your delegation is below.')
  }
  if (state === 'turning') return `The key cut from ZIP ${digits} is going into the Capitol-dome lock while your ZIP is looked up.`
  if (!digits) return 'An uncut key beside a locked padlock whose shackle is the Capitol dome. Type your ZIP code to cut the key.'
  return `A key cut from the digits ${digits.split('').join(' ')}` +
    (digits.length < 5 ? `, ${5 - digits.length} still to go,` : ',') +
    ' beside a locked padlock whose shackle is the Capitol dome.'
}

export default function KeyLock({
  zip,
  state,
  ambiguous = false,
  instant = false,
  className = '',
}: {
  zip: string
  state: KeyLockState
  /** The ZIP spans several districts, so no single delegation is shown. */
  ambiguous?: boolean
  /** Skip the travel/shackle motion (the ceremony already played this page view). */
  instant?: boolean
  className?: string
}) {
  const digits = zip.split('').slice(0, 5)
  const svgRef = useRef<SVGSVGElement>(null)
  const travelStartedAt = useRef<number | null>(null)

  // The key starts travelling on submit ('turning'); the lookup usually answers
  // before it seats. The shackle should start lifting SHACKLE_START_S after the
  // travel began, however long the lookup took, so the delay is the remainder.
  // Set before paint, in the same frame as the class change that starts it.
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (state === 'turning') {
      travelStartedAt.current = performance.now()
    } else if (state === 'unlocked') {
      const started = travelStartedAt.current
      const elapsed = started == null ? 0 : (performance.now() - started) / 1000
      const delay = started == null ? SHACKLE_START_S : Math.max(0, SHACKLE_START_S - elapsed)
      svg.style.setProperty('--keylock-shackle-delay', `${delay.toFixed(3)}s`)
      travelStartedAt.current = null
    } else {
      travelStartedAt.current = null
    }
  }, [state])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 770 290"
      className={`keylock is-${state}${instant ? ' is-instant' : ''} ${className}`}
      overflow="visible"
      role="img"
      aria-label={keyLockLabel(zip, state, ambiguous)}
    >
      <g className="keylock-key">
        {/* bow: the brand mark's solid dome (Logo.tsx) with the gap between
            its legs filled in, so the key's head is the same Capitol silhouette
            as the lock and the nav mark — no stroked colonnade. Scaled 5x and
            placed so the base straddles the blade; keyhole is the logo's too. */}
        <g transform="translate(-32 -30) scale(5)" fill="#C79A3E">
          <path d={DOME_SHACKLE_PATH} />
          {/* overlaps each leg by 1 unit — edge-to-edge left a hairline seam */}
          <path d="M16 18.5h16V31H16z" />
        </g>
        <path transform="translate(-8 -46) scale(4)" d={KEYHOLE_PATH} fill="#0A2463" />

        {/* blade + tip */}
        <path d="M138 78H508L530 95L508 112H138z" fill="#C79A3E" />
        {TEETH_X.map((x, i) => (
          <rect
            key={x}
            className="keylock-tooth"
            x={x}
            y={BLADE_BOTTOM - 1}
            width={TOOTH_W + (i < 4 ? 1 : 0)}
            height={FULL + 1}
            fill="#C79A3E"
            style={{ transform: `scaleY(${toothScale(digits[i])})` }}
          />
        ))}
        {TEETH_X.map((x, i) => (
          <text
            key={`d${x}`}
            x={x + TOOTH_W / 2}
            y="206"
            textAnchor="middle"
            className="keylock-digit"
            fill={digits[i] ? '#FFFFFF' : '#B7C1D8'}
          >
            {digits[i] ?? '·'}
          </text>
        ))}
      </g>

      {/* shackle: the brand mark's solid dome (Logo.tsx), scaled 4.8x so its
          legs land in the body below. The outer group is what lifts. */}
      <g className="keylock-shackle">
        <path transform="translate(554.8 -2.8) scale(4.8)" d={DOME_SHACKLE_PATH} fill="#F4F6FA" />
      </g>

      {/* body — drawn after the key so the blade disappears into it */}
      <rect x="586" y="122" width="168" height="150" rx="12" fill="#F4F6FA" />
      <path transform="translate(554.8 28) scale(4.8)" d={KEYHOLE_PATH} fill="#0A2463" />
    </svg>
  )
}
