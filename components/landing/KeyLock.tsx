'use client'

import { useLayoutEffect, useRef } from 'react'
import { DOME_SHACKLE_PATH, KEYHOLE_PATH } from '@/components/ui/Logo'

/**
 * The landing hero's key and lock. The visitor holds the key: a plain round
 * bow with a ring hole and a slim blade whose five teeth are cut from their
 * ZIP digits. The Capitol dome appears only on the lock (the brand mark).
 * On submit the key slides all the way into the lock in one motion; when the
 * lookup succeeds the dome shackle lifts as the key seats.
 *
 * Every tooth is its own trapezoid scaled from the blade edge, so re-cutting
 * eases in all browsers (a single morphing path only animates in some).
 * Before typing, faint ghost teeth show where the cuts will go. Timings live
 * in globals.css under `.keylock`.
 */

const TEETH_X = [186, 246, 306, 366, 426] // left edge of each tooth slot
const TOOTH_TOP = 56 // tooth width where it leaves the blade
const TOOTH_BOTTOM_INSET = 14 // each angled side steps in this much by the tip
const BLADE_BOTTOM = 105
const FULL = 58 // deepest cut (digit 9); the tooth is drawn at this depth and scaled
const SHALLOW = 14 // shallowest cut (digit 0)
const GHOST = 30 // depth of the faint uncut tooth shown before a digit is typed
/** When the shackle starts lifting, measured from the start of the key's travel. */
const SHACKLE_START_S = 0.35

/** Tooth depth in SVG units: 0 for a blank position, 14 (digit 0) to 58 (digit 9). */
export function toothDepth(digit: string | undefined): number {
  if (digit == null || !/^\d$/.test(digit)) return 0
  return SHALLOW + (Number(digit) * (FULL - SHALLOW)) / 9
}

/** A tooth hanging from the blade, angled sides; overlaps the blade by 1 unit. */
function toothPath(x: number, depth: number): string {
  const inset = TOOTH_BOTTOM_INSET * (depth / FULL)
  const top = BLADE_BOTTOM - 1
  return `M${x} ${top}H${x + TOOTH_TOP}L${x + TOOTH_TOP - inset} ${BLADE_BOTTOM + depth}H${x + inset}z`
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
        {/* bow: a plain ring with a round hole, on the visitor's side */}
        <path
          fillRule="evenodd"
          fill="#C79A3E"
          d="M46 95a50 50 0 1 0 100 0a50 50 0 1 0-100 0zM62 95a16 16 0 1 0 32 0a16 16 0 1 0-32 0z"
        />
        {/* shoulder: joins bow to blade */}
        <rect x="140" y="77" width="16" height="36" rx="3" fill="#C79A3E" />

        {/* blade + tip — slim, so it reads as a blade, not a platform */}
        <path d="M150 85H510L530 95L510 105H150z" fill="#C79A3E" />

        {/* ghost teeth: where the cuts will go, before a digit is typed */}
        {TEETH_X.map((x, i) => (
          <path
            key={`g${x}`}
            className={`keylock-ghost${digits[i] ? ' is-cut' : ''}`}
            d={toothPath(x, GHOST)}
            fill="#C79A3E"
            fillOpacity={0.3}
          />
        ))}
        {TEETH_X.map((x, i) => (
          <path
            key={x}
            className="keylock-tooth"
            d={toothPath(x, FULL)}
            fill="#C79A3E"
            style={{ transform: `scaleY(${toothDepth(digits[i]) / FULL})` }}
          />
        ))}
        {TEETH_X.map((x, i) => (
          <text
            key={`d${x}`}
            x={x + TOOTH_TOP / 2}
            y="196"
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

/** The logo's lock body (Logo.tsx), drawn on the same 48-unit grid. */
const GLYPH_BODY_PATH = 'M9.5 26h29a3 3 0 0 1 3 3v12.5a3 3 0 0 1-3 3h-29a3 3 0 0 1-3-3V29a3 3 0 0 1 3-3z'

/**
 * Small open lock for narrow screens, where the big illustration is hidden.
 * It sits beside the results heading, so it only ever shows unlocked; with
 * `animate` the dome shackle lifts as the results fade in.
 */
export function LockGlyph({ animate, className = '' }: { animate: boolean; className?: string }) {
  return (
    <svg viewBox="0 -6 48 51" aria-hidden="true" focusable="false"
      className={`keylock-glyph${animate ? ' is-animated' : ''} ${className}`}>
      <g className="keylock-glyph-shackle">
        <path d={DOME_SHACKLE_PATH} fill="currentColor" />
      </g>
      <path fillRule="evenodd" fill="currentColor" d={GLYPH_BODY_PATH + KEYHOLE_PATH} />
    </svg>
  )
}
