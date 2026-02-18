'use client'

import { useEffect, useState, useRef } from 'react'
import { FileText, Vote, Shield } from 'lucide-react'

function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1500
          const steps = 40
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.round(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function HeroStats() {
  return (
    <div className="max-w-2xl mx-auto mt-16 animate-in delay-400" style={{ opacity: 0 }}>
      <div className="grid grid-cols-3 gap-6">
        {[
          { icon: FileText, value: 50, suffix: '+', label: 'Bills tracked', color: 'text-[--accent]' },
          { icon: Vote, value: 100, suffix: '%', label: 'Free forever', color: 'text-[--success]' },
          { icon: Shield, value: 0, suffix: '', label: 'Ads or paywalls', color: 'text-white' },
        ].map((stat) => (
          <div key={stat.label} className="text-center group">
            <div className="w-10 h-10 mx-auto mb-3 bg-white/[0.05] rounded-lg flex items-center justify-center border border-white/[0.06] group-hover:border-[--accent]/30 transition-colors">
              <stat.icon className="w-4 h-4 text-white/40" />
            </div>
            <p className={`font-display text-2xl font-extrabold ${stat.color}`}>
              <AnimatedCount target={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-sm text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
