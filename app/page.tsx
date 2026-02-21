import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import {
  Vote, BookOpen, BarChart3, Shield, Users, ArrowRight,
  MessageSquare, FileText, TrendingUp, Zap
} from 'lucide-react'
import TypewriterHero from '@/components/landing/TypewriterHero'

// ── STATIC DATA ──
const FEATURES = [
  { icon: FileText, title: 'AI-Powered Summaries', desc: 'Complex legislation translated into plain English in seconds.', colSpan: 'md:col-span-2 lg:col-span-1' },
  { icon: Shield, title: 'Unbiased Analysis', desc: 'Impact assessments across demographics with no partisan spin.', colSpan: 'md:col-span-1' },
  { icon: MessageSquare, title: 'Verified Discourse', desc: 'Debate the merits of bills with real, verified citizens.', colSpan: 'md:col-span-1' },
  { icon: TrendingUp, title: 'Civic Score', desc: 'Earn badges and level up your civic engagement profile.', colSpan: 'md:col-span-1' },
  { icon: BookOpen, title: 'Direct Sources', desc: 'Full legislative text pulled straight from Congress.gov.', colSpan: 'md:col-span-1' },
  { icon: Users, title: 'National Sentiment', desc: 'See how citizens across the country are voting on legislation.', colSpan: 'md:col-span-2 lg:col-span-1' },
]

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[--accent] selection:text-white overflow-hidden">

      {/* ── HEADER ── */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-5 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 bg-gradient-to-br from-[--accent] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-[--accent]/30">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-white tracking-tight">
              Democracy Unlocked
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {userId ? (
              <Link href="/dashboard" className="btn-primary text-sm shadow-md hover:shadow-lg transition-all py-2.5 px-5 rounded-full">
                Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="hidden sm:block px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/sign-up" className="btn-primary text-sm shadow-lg shadow-[--accent]/20 hover:shadow-[--accent]/40 transition-all py-2.5 px-6 rounded-full bg-white text-black hover:bg-gray-100 font-semibold">
                  Join Free <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── DYNAMIC HERO ── */}
      <section className="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center">
        {/* Animated Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[--accent]/30 rounded-full blur-[150px] animate-pulse mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse delay-1000 mix-blend-screen pointer-events-none" />

        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">

          {/* Badge — honest */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
            <Zap className="w-4 h-4 text-[--accent]" />
            <span className="text-sm font-medium text-white/90">Free &amp; open source civic engagement</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-[5rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[1.1] tracking-tight mb-8">
            <TypewriterHero />
          </h1>

          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Read real legislation. Cast your vote. See how your views compare to Congress. All powered by AI and official data from Congress.gov.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href={userId ? '/dashboard' : '/sign-up'} className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-[--accent] to-blue-600 text-white shadow-xl shadow-[--accent]/20 hover:scale-105 hover:shadow-2xl hover:shadow-[--accent]/40 transition-all duration-300">
              Start voting now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/bills" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full border border-white/20 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-300">
              Browse bills
            </Link>
          </div>

          {/* Value props instead of fake social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
            {['Free forever', 'No ads', 'Nonpartisan', 'Privacy-first'].map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[--success] rounded-full" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO GRID FEATURES ── */}
      <section className="py-32 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              A dashboard for democracy.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">Everything you need to bypass the media spin and go straight to the source.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feat => (
              <div key={feat.title} className={`bg-[#111] border border-white/10 rounded-3xl p-8 hover:bg-white/5 transition-all duration-300 group ${feat.colSpan}`}>
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[--accent]/20 group-hover:scale-110 transition-all duration-300">
                  <feat.icon className="w-7 h-7 text-[--accent] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3 text-white">{feat.title}</h3>
                <p className="text-white/50 leading-relaxed text-lg">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-32 px-6 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Three steps to civic power.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">No jargon. No spin. Just you and the legislation.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                desc: 'Cast your position on real Congressional bills. Track your history and see how your views evolve.',
              },
              {
                icon: BarChart3,
                step: '03',
                title: 'Compare',
                desc: 'See your alignment score with your elected representatives based on actual roll call votes.',
              },
            ].map((item) => (
              <div key={item.title} className="relative bg-[#111] border border-white/10 rounded-2xl p-8 group hover:border-white/20 transition-all">
                <span className="absolute -top-3 -left-3 w-8 h-8 bg-[--accent] text-white text-xs font-bold rounded-full flex items-center justify-center font-display">
                  {item.step}
                </span>
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[--accent]/20 transition-colors">
                  <item.icon className="w-6 h-6 text-[--accent]" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900 to-[--dark] rounded-[3rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl border border-white/10">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight leading-tight">
              Ready to take your seat at the table?
            </h2>
            <p className="text-2xl text-white/70 mb-12">
              Free, private, and fiercely nonpartisan.
            </p>
            <Link href={userId ? '/dashboard' : '/sign-up'} className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold rounded-full bg-white text-black hover:scale-105 hover:bg-gray-100 transition-all shadow-xl shadow-white/10">
              Get Started — It&apos;s Free <ArrowRight className="w-6 h-6 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black py-10 px-6 border-t border-white/[0.05]">
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
    </main>
  )
}
