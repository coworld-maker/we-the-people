import { SignUp } from '@clerk/nextjs'
import { Check } from 'lucide-react'
import { clerkAppearance } from '@/lib/clerkAppearance'

export const metadata = { title: 'Create your account' }

// What an account actually adds — everything listed is already true of the
// product; reading bills and looking up representatives needs no account.
const REASONS = [
  'Vote on real bills and see how your representatives voted',
  'Your vote is never shown next to your name to other people',
  'Free — no card, no ads, no spam',
]

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-[--text] mb-2">
          Create your free account
        </h1>
        <p className="text-sm text-[--text-muted] mb-4">
          Takes about a minute. Next, we&rsquo;ll email you a 6-digit code to confirm it&rsquo;s you.
        </p>
        <ul className="space-y-2">
          {REASONS.map(r => (
            <li key={r} className="flex items-start gap-2 text-sm text-[--text-secondary]">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-[--gold-text]" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <SignUp appearance={clerkAppearance} />
    </div>
  )
}
