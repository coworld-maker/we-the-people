import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import {
  Vote, BookOpen, BarChart3, Shield, Users, ArrowRight,
  CheckCircle2, MessageSquare, FileText, TrendingUp,
} from 'lucide-react'
import TypewriterHero from '@/components/landing/TypewriterHero'
import HeroStats from '@/components/landing/HeroStats'

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ── */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[--accent] rounded-lg flex items-center justify-center">
              <Vote className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-base font-bold text-white">
              Democracy Unlocked
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userId ? (
              <Link href="/dashboard" className="btn-primary text-sm">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link href="/sign-up" className="btn-primary text-sm">
                  Get started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-gradient pt-32 pb-28 px-6 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full mb-8 animate-in">
            <div className="w-1.5 h-1.5 bg-[--success] rounded-full" />
            <span className="text-sm text-white/50 font-medium">Tracking the 118th Congress</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] mb-2 animate-in delay-100" style={{ opacity: 0 }}>
            <TypewriterHero />
          </h1>

          <p className="text-lg sm:text-xl text-white/30 max-w-xl mx-auto mt-6 mb-10 leading-relaxed font-body animate-in delay-200" style={{ opacity: 0 }}>
            AI-powered bill analysis, citizen voting, and public sentiment —
            the tools you need to participate in democracy.
          </p>

          <div className="flex flex-wrap justify-center gap-3 animate-in delay-300" style={{ opacity: 0 }}>
            <Link href={userId ? '/dashboard' : '/sign-up'} className="btn-primary px-7 py-3.5 text-base rounded-xl">
              Start voting — it&apos;s free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/bills" className="btn-secondary px-7 py-3.5 text-base rounded-xl bg-white/[0.06] border-white/[0.1] text-white hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-white">
              Browse bills
            </Link>
          </div>
        </div>

        {/* Interactive stats bar */}
        <HeroStats />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">How it works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              Civic engagement, simplified
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: BookOpen,
                step: '01',
                title: 'Read',
                desc: 'AI breaks down complex legislation into clear, plain-language summaries with balanced pros and cons.',
              },
              {
                icon: Vote,
                step: '02',
                title: 'Vote',
                desc: 'Cast your position on real Congressional bills. Track your history and see how your views evolve over time.',
              },
              {
                icon: BarChart3,
                step: '03',
                title: 'Understand',
                desc: 'See how citizens across the country feel. Explore impact analysis across demographics and policy areas.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="relative mx-auto mb-5 w-14 h-14">
                  <div className="w-14 h-14 bg-[--accent-light] rounded-xl flex items-center justify-center group-hover:bg-[--accent] transition-colors duration-300">
                    <item.icon className="w-5 h-5 text-[--accent] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[--dark] text-white text-[10px] font-bold rounded-full flex items-center justify-center font-display">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-[--text-secondary] leading-relaxed text-[15px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-[--surface-secondary]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">Platform</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              Everything you need to stay informed
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: FileText, title: 'AI-Powered Summaries', desc: 'Every bill explained in plain English with nonpartisan analysis of key provisions and implications.' },
              { icon: Shield, title: 'Balanced Analysis', desc: 'Pros, cons, and impact assessments across demographics — always presenting multiple perspectives.' },
              { icon: MessageSquare, title: 'Citizen Discussion', desc: 'Moderated discussion boards where citizens can respectfully debate the merits of legislation.' },
              { icon: TrendingUp, title: 'Civic Score', desc: 'Track your engagement with XP, badges, and levels as you participate in the democratic process.' },
              { icon: BookOpen, title: 'Full Bill Text', desc: 'Read the complete legislative text pulled directly from Congress.gov — no paywalls or gatekeeping.' },
              { icon: Users, title: 'Public Sentiment', desc: 'See how citizens vote on every bill with real-time statistics and sentiment breakdowns.' },
            ].map(feat => (
              <div key={feat.title} className="card p-6 lift group">
                <div className="w-10 h-10 bg-[--accent-light] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[--accent] transition-colors duration-300">
                  <feat.icon className="w-4.5 h-4.5 text-[--accent] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-display text-base font-bold mb-1.5">{feat.title}</h3>
                <p className="text-sm text-[--text-secondary] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">Why this matters</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-6">
              Democracy works better when people participate
            </h2>
            <p className="text-[--text-secondary] text-lg leading-relaxed">
              Most Americans can&apos;t name a single bill Congress is working on. We believe
              that&apos;s not apathy — it&apos;s a design problem. Democracy Unlocked makes
              legislation accessible, understandable, and actionable.
            </p>
          </div>

          <div className="space-y-4">
            {[
              'Nonpartisan — we never take sides or push agendas',
              'Open source — our code and methodology are transparent',
              'Privacy-first — anonymous voting, no data selling, ever',
              'Free forever — civic tools should never be behind a paywall',
            ].map(point => (
              <div key={point} className="flex items-start gap-3 p-4 bg-[--surface-secondary] rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[--success] mt-0.5 shrink-0" />
                <p className="text-[15px] text-[--text]">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hero-gradient py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Your seat at the table is waiting
          </h2>
          <p className="text-lg text-white/40 mb-10">
            Join citizens who are taking an active role in shaping the future. Free, private, nonpartisan.
          </p>
          <Link href={userId ? '/dashboard' : '/sign-up'} className="btn-primary px-8 py-4 text-base rounded-xl">
            Get started — free forever <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[--dark] py-10 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[--accent] rounded flex items-center justify-center">
              <Vote className="w-3 h-3 text-white" />
            </div>
            <span className="font-display text-sm font-semibold text-white/60">Democracy Unlocked</span>
          </div>
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Democracy Unlocked. Not affiliated with the U.S. Government.
          </p>
        </div>
      </footer>
    </div>
  )
}
