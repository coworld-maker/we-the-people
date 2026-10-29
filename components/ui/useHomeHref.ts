'use client'

import { useAuth } from '@clerk/nextjs'

// "Home" is the personal dashboard, which needs an account. Signed-out
// visitors go to the landing page instead of being bounced to sign-in.
// While Clerk is still loading we keep /dashboard so signed-in users never
// see the link flip.
export function useHomeHref(): string {
  const { isSignedIn } = useAuth()
  return isSignedIn === false ? '/' : '/dashboard'
}
