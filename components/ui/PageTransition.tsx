'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [displayChildren, setDisplayChildren] = useState(children)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    // If pathname changed, animate out then in
    if (pathname !== prevPathname.current) {
      setIsVisible(false)

      const timer = setTimeout(() => {
        setDisplayChildren(children)
        prevPathname.current = pathname

        // Small delay to let DOM update, then fade in
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsVisible(true)
          })
        })
      }, 150) // match CSS transition duration

      return () => clearTimeout(timer)
    } else {
      // Same path, just update children
      setDisplayChildren(children)
    }
  }, [pathname, children])

  return (
    <div
      className="page-transition"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      {displayChildren}
    </div>
  )
}
