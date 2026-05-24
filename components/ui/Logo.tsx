'use client'

import { useState } from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  /**
   * 'mark'  — icon-only (lock + Capitol). Tries /logo-mark.png first,
   *           falls back to an inline SVG if missing.
   * 'full'  — full logo including the wordmark. Tries /logo.png; falls
   *           back to the SVG mark + a text wordmark.
   * 'auto'  — same as 'mark'.
   */
  variant?: 'mark' | 'full' | 'auto'
  priority?: boolean
}

/**
 * Brand logo. Prefers the image asset (set up via scripts/prepare-logo.py)
 * but always renders an inline-SVG fallback when the image isn't there yet,
 * so the site never appears broken just because the file hasn't been saved.
 */
export default function Logo({
  className = 'w-7 h-7',
  variant = 'auto',
  priority = false,
}: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const useFull = variant === 'full'
  const src = useFull ? '/logo.png' : '/logo-mark.png'

  if (imgFailed) {
    // ── SVG fallback ──────────────────────────────────────────────────
    // Padlock body with Capitol dome arching as the shackle. Renders well
    // at any size; uses currentColor so it inherits the surrounding text.
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Democracy Unlocked logo"
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

  if (useFull) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={src}
          alt="Democracy Unlocked"
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-contain"
          priority={priority}
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} aria-label="Democracy Unlocked">
      <Image
        src={src}
        alt=""
        fill
        sizes="64px"
        className="object-contain"
        priority={priority}
        onError={() => setImgFailed(true)}
      />
    </div>
  )
}
