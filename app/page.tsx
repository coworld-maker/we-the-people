import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import {
  Vote, BookOpen, BarChart3, Shield, Users, ArrowRight,
  MessageSquare, FileText, TrendingUp,
} from 'lucide-react'
import CivicHero from '@/components/landing/CivicHero'
import prisma from '@/lib/prisma'
import Logo from '@/components/ui/Logo'
import CookieConsent from '@/components/legal/CookieConsent'

// ── STATIC DATA ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FileText,       title: 'AI-Powered Summaries', desc: 'Complex legislation translated into plain English in seconds.', accent: 'text-[--accent]',     bg: 'bg-[--accent-light]' },
  { icon: Shield,         title: 'Unbiased Analysis',    desc: 'Impact assessments across demographics with no partisan spin.', accent: 'text-emerald-700',     bg: 'bg-emerald-50' },
  { icon: MessageSquare,  title: 'Verified Discourse',   desc: 'Debate the merits of bills with real, verified citizens.',      accent: 'text-purple-700',      bg: 'bg-purple-50' },
  { icon: TrendingUp,     title: 'Civic Score',          desc: 'Earn badges and level up your civic engagement profile.',       accent: 'text-amber-700',       bg: 'bg-amber-50' },
  { icon: BookOpen,       title: 'Direct Sources',       desc: 'Full legislative text pulled straight from Congress.gov.',      accent: 'text-[--accent-red]',   bg: 'bg-[--accent-red-light]' },
  { icon: Users,          title: 'National Sentiment',   desc: 'See how citizens across the country are voting on legislation.', accent: 'text-blue-700',        bg: 'bg-blue-50' },
]

// ─────────────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const { userId } = await auth()
  const billCount = await prisma.bill.count().catch(() => 0)

  return (
    <main className="min-h-screen bg-[--bg] text-[--text] selection:bg-[--accent] selection:text-white">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 px-6 py-3.5 border-b border-[--border] bg-[--surface]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity">
            <Logo className="w-9 h-9 text-[--accent]" variant="mark" priority />
            <span className="font-serif text-lg text-[--accent] tracking-tight">
              Democracy Unlocked<span className="align-super text-[9px] ml-0.5">™</span>
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
              title="This site is in beta — expect rough edges and incomplete data while we keep building."
            >
              Beta
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {userId ? (
              <Link href="/dashboard"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-[--radius] bg-[--accent] text-white hover:bg-[--accent-hover] transition-colors"
              >
                Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="hidden sm:block px-4 py-2 text-sm font-medium text-[--text-secondary] hover:text-[--accent] transition-colors">
                  Log in
                </Link>
                <Link href="/sign-up"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-[--radius] bg-[--accent] text-white hover:bg-[--accent-hover] transition-colors"
                >
                  Get started <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <CivicHero billCount={billCount} signedIn={!!userId} />

      {/* ── BENTO GRID ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[--bg]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[--text] tracking-tight mb-4">
              A dashboard for democracy.
            </h2>
            <p className="text-xl text-[--text-secondary] max-w-2xl mx-auto">
              Everything you need to bypass the media spin and go straight to the source.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(feat => (
              <div
                key={feat.title}
                className="card p-8 hover:border-[--accent] hover:shadow-md transition-all duration-200 group"
              >
                <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                  <feat.icon className={`w-6 h-6 ${feat.accent}`} />
                </div>
                <h3 className="font-display text-xl font-bold mb-2 text-[--text]">{feat.title}</h3>
                <p className="text-[--text-secondary] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[--surface-secondary]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[--text] tracking-tight mb-4">
              Three steps to civic power.
            </h2>
            <p className="text-xl text-[--text-secondary] max-w-2xl mx-auto">
              No jargon. No spin. Just you and the legislation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen,  step: '01', title: 'Read',    desc: 'AI breaks down complex legislation into clear, plain-language summaries with balanced pros and cons.' },
              { icon: Vote,      step: '02', title: 'Vote',    desc: 'Cast your position on real Congressional bills. Track your history and see how your views evolve.' },
              { icon: BarChart3, step: '03', title: 'Compare', desc: 'See your alignment score with your elected representatives based on actual roll call votes.' },
            ].map(item => (
              <div key={item.title} className="relative card p-8 group hover:border-[--accent] transition-all">
                <span className="absolute -top-3 -left-3 w-8 h-8 bg-[--accent] text-white text-xs font-bold rounded-full flex items-center justify-center font-display shadow-md">
                  {item.step}
                </span>
                <div className="w-12 h-12 bg-[--accent-light] rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <item.icon className="w-6 h-6 text-[--accent]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[--text] mb-2">{item.title}</h3>
                <p className="text-[--text-secondary] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[--bg]">
        <div className="max-w-6xl mx-auto hero-gradient rounded-[2.5rem] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
          {/* Texture overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Ready to take your seat at the table?
            </h2>
            <p className="text-xl text-white/80 mb-10">
              Free, private, and fiercely nonpartisan.
            </p>
            <Link
              href={userId ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full bg-white text-[--accent] hover:scale-105 hover:bg-white/95 transition-all shadow-xl"
            >
              Get Started — It&apos;s Free <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-[--surface] py-10 px-6 border-t border-[--border]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[--accent]">
            <Logo className="w-6 h-6" variant="mark" />
            <span className="font-display text-sm font-semibold text-[--text-secondary]">Democracy Unlocked<span className="align-super text-[8px] ml-0.5">™</span></span>
          </div>
          <nav className="flex items-center gap-4 text-xs font-medium text-[--text-muted]">
            <Link href="/privacy" className="hover:text-[--accent] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[--accent] transition-colors">Terms</Link>
          </nav>
          <p className="text-xs text-[--text-muted]">
            &copy; {new Date().getFullYear()} Democracy Unlocked&trade;. &ldquo;Democracy Unlocked&rdquo; and the logo are trademarks of Democracy Unlocked.
          </p>
        </div>
      </footer>

      {/* GDPR cookie banner — renders only when the user hasn't decided yet */}
      <CookieConsent />
    </main>
  )
}
