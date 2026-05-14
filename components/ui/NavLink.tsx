'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap
        ${active
          ? 'text-[--accent] bg-[--accent]/10'
          : 'text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary]'
        }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  )
}
