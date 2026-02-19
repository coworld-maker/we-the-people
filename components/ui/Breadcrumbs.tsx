'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  bills: 'Bills',
  'policy-areas': 'Policy Areas',
  'action-center': 'Action Center',
  scorecards: 'Scorecards',
  learn: 'Learn',
  transparency: 'Transparency',
  news: 'News',
  about: 'About',
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show on dashboard root
  if (pathname === '/dashboard') return null

  // Build crumb segments
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter(s => s !== '(dashboard)') // strip route group

  // Don't render for single-segment paths (they're top-level pages)
  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const isLast = i === segments.length - 1
    const label = LABEL_MAP[segment] || decodeURIComponent(segment).replace(/-/g, ' ')

    return { href, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-xs">
        <li>
          <Link href="/dashboard" className="text-[--text-muted] hover:text-[--accent] transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-[--text-muted]/40" />
            {crumb.isLast ? (
              <span className="text-[--text] font-medium capitalize">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-[--text-muted] hover:text-[--accent] transition-colors capitalize">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
