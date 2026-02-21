import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import {
  Vote, BookOpen, BarChart3, Shield, Users, ArrowRight,
  CheckCircle2, MessageSquare, FileText, TrendingUp,
  Star, Activity, Globe
} from 'lucide-react'
import TypewriterHero from '@/components/landing/TypewriterHero'

// ── STATIC DATA ──
const FEATURES = [
  { icon: FileText, title: 'AI-Powered Summaries', desc: 'Complex legislation translated into plain English in seconds.', colSpan: 'md:col-span-2 lg:col-span-1' },
  { icon: Shield, title: 'Unbiased Analysis', desc: 'Impact assessments across demographics with no partisan spin.', colSpan: 'md:col-span-1' },
  { icon: MessageSquare, title: 'Verified Discourse', desc: 'Debate the merits of bills with real, verified citizens.', colSpan: 'md:col-span-1' },
  { icon: TrendingUp, title: 'Civic Score', desc: 'Earn badges and level up your civic engagement profile.', colSpan: 'md:col-span-1' },
  { icon: BookOpen, title: 'Direct Sources', desc: 'Full legislative text pulled straight from Congress.gov.', colSpan: 'md:col-span-1' },
  { icon: Users, title: 'National Sentiment', desc: 'Real-time heatmaps of how the country is voting.', colSpan: 'md:col-span-2 lg:col-span-1' },
]

// Avatar initials as fallback instead of external images
const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
const AVATAR_INITIALS = ['JM', 'SK', 'AR', 'TC', 'LP']

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

          {/* Top App Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-white/90">Rated #1 Civic Engagement Platform</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-[5rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[1.1] tracking-tight mb-8">
            <TypewriterHero />
          </h1>

          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Stop scrolling the news. Start shaping it. Join hundreds of thousands of Americans reading, voting, and discussing real legislation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href={userId ? '/dashboard' : '/sign-up'} className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-[--accent] to-blue-600 text-white shadow-xl shadow-[--accent]/20 hover:scale-105 hover:shadow-2xl hover:shadow-[--accent]/40 transition-all duration-300">
              Start voting now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

          {/* Social Proof Avatars */}
          <div className="mt-10 flex items-center gap-4 bg-white/5 border border-white/10 py-3 px-6 rounded-full backdrop-blur-sm">
            <div className="flex -space-x-3">
              {AVATAR_INITIALS.map((initials, i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#0A0A0A] ${AVATAR_COLORS[i]} flex items-center justify-center text-xs font-bold text-white`}>
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />)}
              </div>
              <p className="text-sm text-white/80 font-medium">Joined by 150,000+ citizens</p>
            </div>
          </div>
        </div>

        {/* Floating Glassmorphism Card (Simulating Live Action) */}
        <div className="hidden lg:flex absolute left-10 bottom-20 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl animate-bounce" style={{ animationDuration: '4s' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">New vote cast in Ohio</p>
              <p className="text-xs text-white/60">H.R. 815 · 2 seconds ago</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE TICKER (Infinite Scroll Marquee) ── */}
      <div className="w-full bg-[--accent] py-3 overflow-hidden border-y border-white/10 flex relative z-20">
        <div className="flex whitespace-nowrap animate-marquee items-center gap-10 px-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-10">
              <span className="flex items-center gap-2 text-white font-semibold"><Globe className="w-4 h-4" /> LIVE: Senate passes S. 1421</span>
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              <span className="text-white/80">Trending: 8,492 citizens debating H.R. 2</span>
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              <span className="text-white/80">Just In: AI Summary available for AI Regulation Act</span>
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          ))}
        </div>
      </div>

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

      {/* ── CTA ── */}
      <section className="py-32 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900 to-[--dark] rounded-[3rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl border border-white/10">
          {/* Subtle noise texture via CSS gradient */}
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
              Free, private, and fiercely nonpartisan. Join the movement today.
            </p>
            <Link href={userId ? '/dashboard' : '/sign-up'} className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold rounded-full bg-white text-black hover:scale-105 hover:bg-gray-100 transition-all shadow-xl shadow-white/10">
              Unlock Democracy Now <ArrowRight className="w-6 h-6 ml-2" />
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
