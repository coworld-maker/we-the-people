import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, Download, Trash2, Cookie, Mail, MapPin, ChevronRight } from 'lucide-react'
import PrivacyControlsClient from '@/components/legal/PrivacyControlsClient'

export const metadata = {
  title: 'Privacy Controls',
  description: 'Export your data, manage your preferences, or delete your account.',
}

export default async function PrivacyControlsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[--text] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[--accent]" />
          Privacy Controls
        </h1>
        <p className="text-sm text-[--text-secondary] mt-1">
          Your data, your rules. Review what we know about you, change what we
          can do with it, or leave entirely.
        </p>
      </div>

      <div className="space-y-4">
        {/* Quick links */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[--border]">
            <h2 className="font-display text-sm font-bold text-[--text]">Your rights — explained</h2>
          </div>
          <div className="divide-y divide-[--border]">
            <Link href="/privacy#5-your-rights" className="flex items-start gap-3 px-5 py-3.5 hover:bg-[--surface-secondary] transition-colors group">
              <Shield className="w-4 h-4 text-[--accent] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors">Full privacy policy</p>
                <p className="text-xs text-[--text-muted]">What we collect, why, who it's shared with, and how to exercise your rights under GDPR, CCPA, and other state laws.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[--text-muted] mt-0.5 shrink-0 group-hover:text-[--accent] transition-colors" />
            </Link>
          </div>
        </div>

        {/* Client-side interactive controls */}
        <PrivacyControlsClient />

        {/* Communication preferences */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[--accent]" />
            <h2 className="font-display text-sm font-bold text-[--text]">Email preferences</h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-[--text-secondary] mb-3">
              Manage notifications about tracked bills, weekly digests, and
              product updates from your account settings.
            </p>
            <Link href="/account/settings" className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] inline-flex items-center gap-1">
              Manage email preferences <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <div className="card p-5 bg-[--surface-secondary]">
          <p className="text-xs text-[--text-muted] leading-relaxed">
            Need help we can't surface here? Email{' '}
            <a href="mailto:privacy@democracyunlocked.com" className="text-[--accent] hover:underline">
              privacy@democracyunlocked.com
            </a>{' '}
            — we respond within 30 days. EU/EEA residents can also lodge a
            complaint with their local Data Protection Authority.
          </p>
        </div>
      </div>
    </div>
  )
}
