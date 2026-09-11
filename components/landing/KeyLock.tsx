import { DOME_SHACKLE_PATH, KEYHOLE_PATH } from '@/components/ui/Logo'

/**
 * The landing hero's key and lock. The key's bow is the Capitol dome; each ZIP
 * digit cuts one tooth (blank = uncut, higher digit = deeper cut). When the
 * lookup succeeds the key slides into the lock and the dome shackle lifts.
 *
 * Every tooth is its own rect scaled from the blade edge, so re-cutting eases
 * in all browsers (a single morphing path only animates in some). Timings live
 * in globals.css under `.keylock` so locking and unlocking can differ: on
 * unlock the key travels first and the shackle follows as it seats; on relock
 * the shackle drops first and the key backs out after it.
 */

const TEETH_X = [179, 241, 303, 365, 427] // left edge of each 62-wide tooth
const TOOTH_W = 62
const BLADE_BOTTOM = 112
const FULL = 58 // an uncut tooth's depth below the blade

function toothScale(digit: string | undefined): number {
  if (digit == null || !/\d/.test(digit)) return 1
  return (FULL - (Number(digit) + 1) * 5) / FULL
}

/** idle: resting · turning: lookup in flight, key travelling · unlocked: seated, shackle up */
export type KeyLockState = 'idle' | 'turning' | 'unlocked'

export default function KeyLock({
  zip,
  state,
  className = '',
}: {
  zip: string
  state: KeyLockState
  className?: string
}) {
  const digits = zip.split('').slice(0, 5)
  const unlocked = state === 'unlocked'

  return (
    <svg
      viewBox="0 0 770 290"
      className={`keylock is-${state} ${className}`}
      overflow="visible"
      role="img"
      aria-label={
        unlocked
          ? 'The key, cut from your ZIP code, has opened the Capitol-dome lock'
          : 'A key whose teeth are cut from the digits of your ZIP code, beside a lock whose shackle is the Capitol dome'
      }
    >
      <g className="keylock-key">
        {/* bow: the brand mark's solid dome (Logo.tsx) with the gap between
            its legs filled in, so the key's head is the same Capitol silhouette
            as the lock and the nav mark — no stroked colonnade. Scaled 5x and
            placed so the base straddles the blade; keyhole is the logo's too. */}
        <g transform="translate(-32 -30) scale(5)" fill="#C79A3E">
          <path d={DOME_SHACKLE_PATH} />
          <path d="M17 18.5h14V31H17z" />
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
