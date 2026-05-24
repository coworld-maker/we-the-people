import Image from 'next/image'

interface LogoProps {
  className?: string
  /**
   * 'mark'  — show just the Capitol-lock icon (crops out the wordmark below).
   *           Use in tight nav slots where the brand name appears separately.
   * 'full'  — show the entire logo including the "DEMOCRACY UNLOCKED" wordmark.
   *           Use on hero / about / footer where it stands on its own.
   * 'auto'  — same as 'mark'; sensible default for most usages.
   */
  variant?: 'mark' | 'full' | 'auto'
  priority?: boolean
}

const SRC = '/logo.png'

/**
 * Democracy Unlocked logo. The source file is a square image with the icon
 * (open padlock + Capitol dome) occupying roughly the top 75% and the
 * "DEMOCRACY UNLOCKED" wordmark in the bottom 25%.
 *
 * For the 'mark' variant we crop to the icon by clipping the bottom portion;
 * for 'full' we show the whole image. Either way it's the same source file —
 * no separate crop needed on disk.
 */
export default function Logo({
  className = 'w-7 h-7',
  variant = 'auto',
  priority = false,
}: LogoProps) {
  const isFull = variant === 'full'

  if (isFull) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={SRC}
          alt="Democracy Unlocked"
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-contain"
          priority={priority}
        />
      </div>
    )
  }

  // 'mark' / 'auto' — crop to top portion (the lock + dome). The wrapper has
  // overflow:hidden and we scale the image so the icon fills the square.
  return (
    <div className={`relative overflow-hidden ${className}`} aria-label="Democracy Unlocked logo">
      <Image
        src={SRC}
        alt=""
        fill
        sizes="64px"
        className="object-cover object-top"
        // image is ~75% icon / 25% wordmark — scaling up 1.33× hides the wordmark
        style={{ transform: 'scale(1.33) translateY(-3%)', transformOrigin: 'top center' }}
        priority={priority}
      />
    </div>
  )
}
