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
      // Typing
      setText(current.substring(0, charIndex + 1))
      setCharIndex(prev => prev + 1)

      if (charIndex + 1 === current.length) {
        // Pause at end of phrase
        setTimeout(() => setIsDeleting(true), 2000)
        return
      }
    } else {
      // Deleting
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
    <span className="text-[--accent]">
      {text}
      <span className="inline-block w-[3px] h-[1em] bg-[--accent] ml-0.5 align-middle animate-blink" />
    </span>
  )
}
