'use client'

import Link from 'next/link'
import { useHomeHref } from './useHomeHref'

// The header logo: the dashboard when signed in, the landing page when not.
// A client component so the (dashboard) layout doesn't have to call auth()
// and turn every public page under it dynamic.
export default function HomeLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Link href={useHomeHref()} className={className}>{children}</Link>
}
