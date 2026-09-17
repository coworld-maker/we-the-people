import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { clerkAppearance } from '@/lib/clerkAppearance'

export const metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-[--text] mb-2">Welcome back</h1>
        <p className="text-sm text-[--text-muted]">
          New here?{' '}
          <Link href="/sign-up" className="font-semibold text-[--accent] hover:underline">
            Create a free account
          </Link>{' '}
          — or{' '}
          <Link href="/bills" className="font-semibold text-[--accent] hover:underline">
            browse bills
          </Link>{' '}
          without one.
        </p>
      </div>

      <SignIn appearance={clerkAppearance} />
    </div>
  )
}
