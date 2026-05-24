'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Logo from '@/components/ui/Logo'

interface Props {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * The landing-page CTA, but clicking it plays a cinematic "unlock" overlay
 * before navigating to the destination. The animation is a moment of entry —
 * click "Start voting" → democracy unlocks → you're in the dashboard.
 *
 * Timing:
 *   0     ms  user clicks, overlay fades in
 *   100   ms  logo scales in with elastic ease
 *   600   ms  golden shimmer beam radiates from the keyhole
 *   1100  ms  hold + brightness pop
 *   1500  ms  navigate to destination (which is already prefetched)
 *
 * Respects prefers-reduced-motion (skips straight to navigation).
 */
const ANIMATION_MS = 1500

export default function UnlockButton({ href, children, className }: Props) {
  const router = useRouter()
  const [playing, setPlaying] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    if (playing) return

    // Reduced-motion users get an instant navigation
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(href)
      return
    }

    setPlaying(true)
    router.prefetch(href)
    // Navigate near the end of the animation so the destination's
    // hydration overlaps with the overlay's fade-out
    setTimeout(() => router.push(href), ANIMATION_MS - 100)
  }

  // Prefetch on hover so the destination is ready when the click happens
  function handleHover() {
    router.prefetch(href)
  }

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={handleHover}
        onFocus={handleHover}
        disabled={playing}
        className={className}
      >
        {children}
      </button>

      {playing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A] animate-overlay-in"
          role="presentation"
          aria-hidden="true"
        >
          <div className="relative w-[min(70vw,420px)] aspect-square animate-unlock">
            {/* Use Logo so the SVG fallback works if logo.png isn't saved yet */}
            <div className="absolute inset-0">
              <Image
                src="/logo.png"
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 70vw, 420px"
                className="object-contain"
                onError={(e) => {
                  // If the image isn't there, hide the <img> and let the
                  // sibling SVG Logo show through instead.
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Logo className="w-full h-full" variant="mark" />
              </div>
            </div>

            {/* Golden shimmer beam from the keyhole */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-2xl opacity-0 animate-unlock-flash"
                style={{
                  background: 'radial-gradient(circle, rgba(212, 175, 55, 0.85) 0%, rgba(212, 175, 55, 0.0) 70%)',
                }}
              />
            </div>
          </div>

          <p className="absolute bottom-10 text-white/40 text-xs pointer-events-none animate-fade-in-late">
            Unlocking democracy…
          </p>

          <style jsx>{`
            @keyframes overlay-in {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes unlock-enter {
              0%   { opacity: 0; transform: scale(0.55) translateY(20px); }
              55%  { opacity: 1; transform: scale(1.04) translateY(0); }
              70%  { transform: scale(0.99); filter: brightness(1.4); }
              80%  { filter: brightness(1); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes unlock-flash {
              0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
              40%  { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
            }
            @keyframes fade-in-late {
              0%, 50% { opacity: 0; }
              80%, 100% { opacity: 1; }
            }
            .animate-overlay-in {
              animation: overlay-in 250ms ease-out both;
            }
            .animate-unlock {
              animation: unlock-enter 1100ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
            }
            .animate-unlock-flash {
              animation: unlock-flash 800ms 700ms ease-out forwards;
            }
            .animate-fade-in-late {
              animation: fade-in-late 1500ms ease-in-out both;
            }
          `}</style>
        </div>
      )}
    </>
  )
}
