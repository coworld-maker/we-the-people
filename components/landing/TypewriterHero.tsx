'use client'

import { useState, useEffect, useCallback } from 'react'

const PHRASES = [
  'Understand legislation.',
  'Make your voice heard.',
  'Hold Congress accountable.',
  'Shape public policy.',
  'Vote on real bills.',
  'Engage with democracy.',
]

export default function TypewriterHero() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [text, setText] = useState('')

  const tick = useCallback(() => {
    const current = PHRASES[phraseIndex]

    if (!isDeleting) {
      setText(current.substring(0, charIndex + 1))
      setCharIndex(prev => prev + 1)

      if (charIndex + 1 === current.length) {
        setTimeout(() => setIsDeleting(true), 2000)
        return
      }
    } else {
      setText(current.substring(0, charIndex - 1))
      setCharIndex(prev => prev - 1)

      if (charIndex - 1 === 0) {
        setIsDeleting(false)
        setPhraseIndex(prev => (prev + 1) % PHRASES.length)
        return
      }
    }
  }, [charIndex, isDeleting, phraseIndex])

  useEffect(() => {
    const speed = isDeleting ? 40 : 80
    const timer = setTimeout(tick, speed)
    return () => clearTimeout(timer)
  }, [tick, isDeleting])

  return (
    <span className="text-[--accent] inline-grid">
      {/* Invisible sizer: renders all phrases stacked, takes the height of the tallest */}
      <span className="col-start-1 row-start-1 invisible pointer-events-none" aria-hidden="true">
        {PHRASES.reduce((a, b) => a.length > b.length ? a : b)}
      </span>
      {/* Visible typed text */}
      <span className="col-start-1 row-start-1">
        {text}
        <span className="inline-block w-[3px] h-[1em] bg-[--accent] ml-0.5 align-middle animate-blink" />
      </span>
    </span>
  )
}
