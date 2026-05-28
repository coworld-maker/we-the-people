'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, Users, Layers, BookOpen, ArrowRight } from 'lucide-react'

const GOALS = [
  {
    icon: ThumbsUp,
    title: 'Vote on bills',
    desc: 'Cast your opinion on active legislation and see how you compare to Congress',
    href: '/bills',
    color: 'text-[--accent]',
    bg: 'bg-[--accent-light]',
  },
  {
    icon: Users,
    title: 'Know my representatives',
    desc: 'Find your senators and house reps and see their full voting records',
    href: '/my-representatives',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Layers,
    title: 'Follow a topic I care about',
    desc: 'Browse legislation by policy area — health, economy, environment and more',
    href: '/policy-areas',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: BookOpen,
    title: 'Learn how Congress works',
    desc: 'Understand the legislative process, bill lifecycle and your civic rights',
    href: '/learn',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
] as const

const STORAGE_KEY = 'welcome_done'

export default function WelcomeGuide() {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function choose(href: string) {
    dismiss()
    router.push(href)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[--surface] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="hero-gradient px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
            Welcome to Democracy Unlocked
          </p>
          <h2 className="font-display text-xl font-extrabold text-white leading-tight">
            What brings you here today?
          </h2>
          <p className="text-sm text-white/70 mt-1">
            Pick a goal and we'll take you straight there.
          </p>
        </div>

        {/* Goal cards */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {GOALS.map(g => (
            <button
              key={g.href}
              onClick={() => choose(g.href)}
              className="group text-left p-4 rounded-xl border border-[--border] hover:border-[--accent]/50 hover:shadow-sm transition-all bg-[--surface] active:scale-[0.97]"
            >
              <div className={`w-8 h-8 rounded-lg ${g.bg} ${g.color} flex items-center justify-center mb-2.5`}>
                <g.icon className="w-4 h-4" />
              </div>
              <p className="font-semibold text-xs text-[--text] leading-snug mb-1 group-hover:text-[--accent] transition-colors">
                {g.title}
              </p>
              <p className="text-[11px] text-[--text-muted] leading-snug">
                {g.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 pb-5 flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-xs text-[--text-muted] hover:text-[--text] transition-colors py-2"
          >
            Skip for now
          </button>
          <button
            onClick={dismiss}
            className="text-xs font-semibold text-[--accent] hover:underline flex items-center gap-1 py-2"
          >
            Go to dashboard <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
