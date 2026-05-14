'use client'

import { useState, useEffect } from 'react'

export interface NavSection {
  id: string
  label: string
}

export default function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  // Highlight whichever section is most in view
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [sections])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    // 56px sticky nav + 16px breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: 'smooth' })
    setActive(id)
  }

  return (
    <div className="flex gap-1 p-1 bg-[--surface-secondary] rounded-xl mb-8 overflow-x-auto scrollbar-hide">
      {sections.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-w-fit ${
            active === id
              ? 'bg-[--surface] text-[--text] shadow-sm'
              : 'text-[--text-secondary] hover:text-[--text]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
