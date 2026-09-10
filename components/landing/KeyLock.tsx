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
      role="img"
      aria-label={
        unlocked
          ? 'The key, cut from your ZIP code, has opened the Capitol-dome lock'
          : 'A key whose teeth are cut from the digits of your ZIP code, beside a lock whose shackle is the Capitol dome'
      }
    >
      <g className="keylock-key">
        {/* bow: the Capitol dome */}
        <path d="M88 14v18" stroke="#8C6A22" strokeWidth="5" strokeLinecap="round" />
        <path d="M20 160V108C20 60 50 32 88 32s68 28 68 76v52z" fill="#C79A3E" />
        <path d="M58 96v52M88 84v64M118 96v52" stroke="#8C6A22" strokeWidth="3.5" strokeLinecap="round" opacity=".5" />
        <circle cx="88" cy="118" r="11" fill="#0A2463" />

        {/* blade + tip */}
        <path d="M150 78H508L530 95L508 112H150z" fill="#C79A3E" />
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

      {/* shackle: the Capitol dome, lantern and colonnade */}
      <g className="keylock-shackle" fill="none" stroke="#F4F6FA" strokeLinecap="round">
        <path d="M670 10v20" strokeWidth="7" />
        <rect x="659" y="26" width="22" height="12" rx="3" fill="#F4F6FA" stroke="none" />
        <path d="M612 128v-26c0-34 26-58 58-58s58 24 58 58v26" strokeWidth="15" />
        <path d="M640 74v54M655 64v64M670 60v68M685 64v64M700 74v54" strokeWidth="4.5" opacity=".45" />
      </g>

      {/* body — drawn after the key so the blade disappears into it */}
      <rect x="586" y="122" width="168" height="150" rx="12" fill="#F4F6FA" />
      <circle cx="670" cy="182" r="12" fill="#0A2463" />
      <path d="M663.5 188l-4 30h21l-4-30z" fill="#0A2463" />
    </svg>
  )
}
