import Image from 'next/image'

interface LogoProps {
  className?: string
  /**
   * 'mark'  — icon-only (lock + Capitol). Uses public/logo-mark.png if
   *           generated via `scripts/prepare-logo.py`; falls back to a
   *           CSS-cropped version of logo.png if not.
   * 'full'  — full logo including the wordmark.
   * 'auto'  — same as 'mark'.
   */
  variant?: 'mark' | 'full' | 'auto'
  priority?: boolean
}

const FULL_SRC = '/logo.png'
const MARK_SRC = '/logo-mark.png'

/**
 * Democracy Unlocked brand logo.
 *
 * Drop the source at public/logo.png, then run:
 *     python3 scripts/prepare-logo.py
 * to generate the pre-cropped mark + favicon. The mark variant of this
 * component will pick up logo-mark.png automatically if it exists.
 */
export default function Logo({
  className = 'w-7 h-7',
  variant = 'auto',
  priority = false,
}: LogoProps) {
  if (variant === 'full') {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={FULL_SRC}
          alt="Democracy Unlocked"
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-contain"
          priority={priority}
        />
      </div>
    )
  }

  // 'mark' / 'auto' — use the pre-cropped mark file. Sharper at small sizes
  // and matches the square aspect ratio of the wrapper without CSS hacks.
  return (
    <div className={`relative ${className}`} aria-label="Democracy Unlocked">
      <Image
        src={MARK_SRC}
        alt=""
        fill
        sizes="64px"
        className="object-contain"
        priority={priority}
      />
    </div>
  )
}
