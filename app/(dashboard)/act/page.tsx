/**
 * Act hub — replaces the old "Engage" hover dropdown with a real page.
 * Every way to take action lives here as a visible card; nothing hidden
 * behind hover. See docs/passdowns/2026-06-12-nav-overhaul.md.
 */

import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import {
  GraduationCap, Landmark, BookOpen, Vote,
  MessageSquare, BarChart3, ExternalLink, ArrowRight, Megaphone, ShieldCheck,
} from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'
import { UserService } from '@/lib/services/userService'
import { isModerator } from '@/lib/admin'

export const metadata = { title: 'Act · Democracy Unlocked' }

const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL || ''

const ACTIONS = [
  {
    href: '/action-center',
    icon: Landmark,
    title: 'Contact your representative',
    desc: 'Find your rep’s office, draft your message, and make your voice count on bills you care about.',
    cta: 'Open Action Center',
    featured: true,
  },
  {
    href: '/get-started?from=act-hub',
    icon: GraduationCap,
    title: 'New here? Start with the guide',
    desc: 'How the app works, how a bill becomes law, and how to find your district — in plain English.',
    cta: 'Get Started',
    featured: true,
  },
  {
    href: '/bills',
    icon: MessageSquare,
    title: 'Join a discussion',
    desc: 'Every bill page has a community discussion. Pick a bill, vote on it, and add your perspective.',
    cta: 'Browse bills',
  },
  {
    href: '/elections',
    icon: Vote,
    title: 'Vote in elections',
    desc: 'Upcoming federal and state elections, registration deadlines, and what’s on your ballot.',
    cta: 'See elections',
  },
  {
    href: '/learn',
    icon: BookOpen,
    title: 'Learn how government works',
    desc: 'Short explainers on Congress, the legislative process, and how to read a bill.',
    cta: 'Learn',
  },
  {
    href: '/transparency',
    icon: BarChart3,
    title: 'Community stats',
    desc: 'How citizens on this platform are voting, and how that compares to Congress.',
    cta: 'View stats',
  },
]

export default async function ActPage() {
  const { userId } = await auth()
  const user = await UserService.getCurrentUser()
  const showModeration = isModerator(userId, user as any)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FadeIn delay={0.05}>
        <div className="hero-gradient rounded-2xl px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex items-center gap-3 mb-1">
            <Megaphone className="w-5 h-5 text-white/80" />
            <h1 className="font-display text-xl font-extrabold text-white">Act</h1>
          </div>
          <p className="text-sm text-white/70 max-w-xl">
            Reading about a bill is step one. Everything on this page turns what you know
            into something your representatives actually hear.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid sm:grid-cols-2 gap-4">
          {ACTIONS.map(a => (
            <Link
              key={a.href}
              href={a.href}
              className={`card p-5 group hover:border-[--accent]/40 transition-colors flex flex-col ${
                a.featured ? 'sm:col-span-1 border-[--accent]/20 bg-[--accent-light]/30' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  a.featured ? 'bg-[--accent] text-white' : 'bg-[--accent-light] text-[--accent]'
                }`}>
                  <a.icon className="w-[18px] h-[18px]" />
                </span>
                <h2 className="font-display text-sm font-bold text-[--text]">{a.title}</h2>
              </div>
              <p className="text-xs text-[--text-muted] leading-relaxed flex-1">{a.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[--accent] group-hover:underline">
                {a.cta} <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}

          {FEEDBACK_URL && (
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-5 group hover:border-[--accent]/40 transition-colors flex flex-col"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-9 h-9 rounded-lg bg-[--accent-light] text-[--accent] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-[18px] h-[18px]" />
                </span>
                <h2 className="font-display text-sm font-bold text-[--text]">Share feedback</h2>
              </div>
              <p className="text-xs text-[--text-muted] leading-relaxed flex-1">
                Tell us what’s confusing, broken, or missing — feedback directly shapes what gets built next.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[--accent] group-hover:underline">
                Open feedback form <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          )}

          {showModeration && (
            <Link
              href="/moderation"
              className="card p-5 group hover:border-[--accent]/40 transition-colors flex flex-col border-amber-200 bg-amber-50/40"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-[18px] h-[18px]" />
                </span>
                <h2 className="font-display text-sm font-bold text-[--text]">Moderation queue</h2>
              </div>
              <p className="text-xs text-[--text-muted] leading-relaxed flex-1">
                Review reported comments and keep discussions healthy. Visible to moderators only.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:underline">
                Open queue <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <p className="text-xs text-[--text-muted] text-center">
          Democracy Unlocked never contacts anyone on your behalf — these tools help{' '}
          <em>you</em> do it, which is what your representative’s office actually counts.
        </p>
      </FadeIn>
    </div>
  )
}
