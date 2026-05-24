'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const STORAGE_KEY = 'unlock-intro-played'

/**
 * Cinematic unlock intro for the landing page. Plays once per session:
 *
 *   0 ─ 600 ms   logo scales in from 0 with elastic ease
 *   600 ─ 1100   "click" — golden shimmer beam from the keyhole, brightness flash
 *   1100 ─ 1700  logo fades up + scales down to header position
 *   1700 ─ 2000  overlay fades; content below becomes interactive
 *
 * Skippable: clicking anywhere ends the intro early. Honors prefers-reduced-motion.
 * Session-gated so returning visitors don't sit through it again.
 */
export default function UnlockIntro() {
  // 'idle' = waiting to start (SSR safe default)
  // 'playing' = animating
  // 'done' = invisible, pointer-events: none
  // 'skipped' = never render
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done' | 'skipped'>('idle')

  useEffect(() => {
    // Already played this session?
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY)) {
      setPhase('skipped')
      return
    }
    // Reduced motion: skip the animation
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setPhase('skipped')
      return
    }
    setPhase('playing')
    const fadeTimer = setTimeout(() => setPhase('done'), 1700)
    const cleanupTimer = setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, '1')
    }, 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(cleanupTimer)
    }
  }, [])

  if (phase === 'idle' || phase === 'skipped') return null

  function handleSkip() {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setPhase('done')
  }

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A] transition-opacity duration-500 ${
        phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="presentation"
      aria-hidden={phase === 'done'}
    >
      {/* Logo container with the unlock animation */}
      <div className="relative w-[min(70vw,420px)] aspect-square animate-unlock">
        <Image
          src="/logo.png"
          alt="Democracy Unlocked"
          fill
          priority
          sizes="(max-width: 768px) 70vw, 420px"
          className="object-contain"
        />

        {/* Golden shimmer beam — radiates from the keyhole at the "click" moment */}
        <div className="absolute inset-0 pointer-events-none animate-shimmer" aria-hidden="true">
          <div
            className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-2xl opacity-0"
            style={{
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.85) 0%, rgba(212, 175, 55, 0.0) 70%)',
              animation: 'unlock-flash 800ms 600ms ease-out forwards',
            }}
          />
        </div>
      </div>

      {/* Skip hint (visible briefly) */}
      <p className="absolute bottom-10 text-white/40 text-xs animate-fade-in-late pointer-events-none">
        Tap anywhere to skip
      </p>

      {/* Keyframes scoped via styled-jsx so they don't pollute globals */}
      <style jsx>{`
        @keyframes unlock-enter {
          0%   { opacity: 0; transform: scale(0.6) translateY(20px); }
          55%  { opacity: 1; transform: scale(1.04) translateY(0); }
          70%  { transform: scale(0.99); filter: brightness(1.4); }
          80%  { filter: brightness(1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes unlock-exit {
          to {
            opacity: 0;
            transform: scale(0.85) translateY(-40px);
          }
        }
        :global(@keyframes unlock-flash) {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          40%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        @keyframes fade-in-late {
          0%, 60% { opacity: 0; }
          80%, 100% { opacity: 1; }
        }
        .animate-unlock {
          animation:
            unlock-enter 1100ms cubic-bezier(0.34, 1.56, 0.64, 1) both,
            unlock-exit 600ms 1100ms ease-in forwards;
        }
        .animate-fade-in-late {
          animation: fade-in-late 2000ms ease-in-out both;
        }
      `}</style>
    </div>
  )
}
