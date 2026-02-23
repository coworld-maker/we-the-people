'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [typedText, setTypedText] = useState('')
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const phrases = [
    'Congressional Bills',
    'Real Legislation',
    'Your Democracy',
    'Your Voice'
  ]

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (typedText.length < currentPhrase.length) {
          setTypedText(currentPhrase.slice(0, typedText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (typedText.length > 0) {
          setTypedText(typedText.slice(0, -1))
        } else {
          setIsDeleting(false)
          setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [typedText, isDeleting, currentPhraseIndex])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            Democracy Unlocked
          </h1>
          
          {/* Fixed height container to prevent layout shift */}
          <div className="h-8 mb-8">
            <p className="text-xl text-gray-600">
              Vote on{' '}
              <span className="inline-block min-w-[280px] text-left">
                <span className="text-blue-600 font-semibold">
                  {typedText}
                  <span className="animate-pulse">|</span>
                </span>
              </span>
            </p>
          </div>
          
          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                📜 Real Bills
              </h3>
              <p className="text-gray-600">
                Vote on actual congressional legislation from Congress.gov
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                🗳️ Your Voice
              </h3>
              <p className="text-gray-600">
                Cast your vote and see how others feel about each bill
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                🔒 Private
              </h3>
              <p className="text-gray-600">
                Your votes are encrypted and you can vote anonymously
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
