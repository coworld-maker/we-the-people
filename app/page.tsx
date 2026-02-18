import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative mesh-bg min-h-[100vh] flex items-center">
        {/* Animated blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B6B] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#6366F1] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-[#38BDF8] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000" />

        {/* Nav */}
        <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B6B] to-[#6366F1] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🗳️</span>
              </div>
              <span className="font-display text-xl font-extrabold text-white tracking-tight">
                Democracy<span className="text-[#FF6B6B]">Unlocked</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {userId ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-red-500/25 transition-all text-sm"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="px-5 py-2.5 text-white/80 hover:text-white font-medium text-sm transition-colors">
                    Log in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-red-500/25 transition-all text-sm"
                  >
                    Join Free 🚀
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full mb-8 animate-fade-in-up">
              <span className="w-2 h-2 bg-[#84CC16] rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">50+ bills tracked from the 118th Congress</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-6 animate-fade-in-up animation-delay-200">
              Your vote.{' '}
              <span className="bg-gradient-to-r from-[#FF6B6B] via-[#FB7185] to-[#F59E0B] bg-clip-text text-transparent">
                Your voice.
              </span>
              <br />
              Your democracy.
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-xl mb-10 leading-relaxed font-body animate-fade-in-up animation-delay-400" style={{ opacity: 0 }}>
              Read real bills in plain English. Vote on legislation. See how your opinion stacks up. Democracy shouldn&apos;t require a law degree.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in-up animation-delay-600" style={{ opacity: 0 }}>
              <Link
                href={userId ? '/dashboard' : '/sign-up'}
                className="group px-8 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] text-white font-bold rounded-2xl text-lg hover:shadow-2xl hover:shadow-red-500/30 transition-all hover:-translate-y-0.5"
              >
                Start Voting — It&apos;s Free
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/bills"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-2xl text-lg hover:bg-white/20 transition-all border border-white/10"
              >
                Browse Bills 📜
              </Link>
            </div>
          </div>

          {/* Stats floating cards */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4">
            <div className="glass-dark rounded-2xl p-5 w-52 animate-float">
              <p className="text-3xl font-display font-extrabold text-white mb-1">50+</p>
              <p className="text-sm text-white/50">Bills Tracked</p>
            </div>
            <div className="glass-dark rounded-2xl p-5 w-52 animate-float animation-delay-200">
              <p className="text-3xl font-display font-extrabold text-[#84CC16] mb-1">Free</p>
              <p className="text-sm text-white/50">Always &amp; Forever</p>
            </div>
            <div className="glass-dark rounded-2xl p-5 w-52 animate-float animation-delay-400">
              <p className="text-3xl font-display font-extrabold text-[#FF6B6B] mb-1">AI</p>
              <p className="text-sm text-white/50">Powered Analysis</p>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L48 45C96 40 192 30 288 35C384 40 480 60 576 65C672 70 768 60 864 50C960 40 1056 30 1152 35C1248 40 1344 60 1392 70L1440 80V100H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="pill bg-indigo-50 text-indigo-600 mb-4">✨ Dead simple</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#0F172A] mb-4">
              Democracy in 3 taps
            </h2>
            <p className="text-lg text-gray-500 max-w-md mx-auto font-body">
              No jargon. No confusion. Just you and the bills that shape your life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                emoji: '📖',
                title: 'Read',
                desc: 'AI breaks down complex bills into plain English anyone can understand. No law degree needed.',
                color: 'from-[#6366F1] to-[#818CF8]',
                glow: 'shadow-indigo-200',
              },
              {
                step: '02',
                emoji: '🗳️',
                title: 'Vote',
                desc: 'Cast your vote on real Congressional bills. Yes, no, or abstain — your voice counts.',
                color: 'from-[#FF6B6B] to-[#FB7185]',
                glow: 'shadow-red-200',
              },
              {
                step: '03',
                emoji: '📊',
                title: 'Compare',
                desc: 'See how citizens across the country feel. Track your voting history. Make an impact.',
                color: 'from-[#84CC16] to-[#A3E635]',
                glow: 'shadow-lime-200',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`group relative bg-white rounded-3xl p-8 border border-gray-100 card-hover shadow-lg ${item.glow}`}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {item.emoji}
                </div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{item.step}</span>
                <h3 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="pill bg-rose-50 text-rose-600 mb-4">🔥 Features</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#0F172A] mb-4">
              Built for the TikTok generation
            </h2>
            <p className="text-lg text-gray-500 max-w-lg mx-auto font-body">
              We made civic engagement something you actually want to do.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '🤖', title: 'AI Summaries', desc: 'Complex bills explained in plain English by AI', bg: 'bg-amber-50', accent: 'text-amber-600' },
              { emoji: '⚖️', title: 'Pros & Cons', desc: 'Balanced analysis of every bill — both sides presented fairly', bg: 'bg-indigo-50', accent: 'text-indigo-600' },
              { emoji: '🎯', title: 'Impact Analysis', desc: 'See how bills affect you — students, workers, families, everyone', bg: 'bg-rose-50', accent: 'text-rose-600' },
              { emoji: '💬', title: 'Citizen Debates', desc: 'Discussion boards to debate bills with fellow citizens', bg: 'bg-violet-50', accent: 'text-violet-600' },
              { emoji: '📜', title: 'Full Bill Text', desc: 'Read the exact wording straight from Congress.gov', bg: 'bg-emerald-50', accent: 'text-emerald-600' },
              { emoji: '🔒', title: 'Anonymous Voting', desc: 'Your vote is yours. Vote without fear.', bg: 'bg-sky-50', accent: 'text-sky-600' },
            ].map((feat) => (
              <div key={feat.title} className="bg-white rounded-2xl p-6 border border-gray-100 card-hover">
                <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center text-xl mb-4`}>
                  {feat.emoji}
                </div>
                <h3 className={`font-display text-lg font-bold ${feat.accent} mb-1`}>{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-body">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative mesh-bg py-24 px-6">
        <div className="absolute top-10 right-20 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[128px] opacity-20" />
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-[#6366F1] rounded-full filter blur-[128px] opacity-20" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            Ready to unlock{' '}
            <span className="bg-gradient-to-r from-[#FF6B6B] to-[#F59E0B] bg-clip-text text-transparent">
              your power
            </span>
            ?
          </h2>
          <p className="text-lg text-white/50 mb-10 font-body">
            Join thousands of citizens who are taking their seat at the table. Free forever.
          </p>
          <Link
            href={userId ? '/dashboard' : '/sign-up'}
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] text-white font-bold rounded-2xl text-xl hover:shadow-2xl hover:shadow-red-500/30 transition-all hover:-translate-y-1"
          >
            Get Started — Free 🗳️
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F172A] border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#6366F1] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🗳️</span>
            </div>
            <span className="font-display font-bold text-white/80 text-sm">
              Democracy<span className="text-[#FF6B6B]">Unlocked</span>
            </span>
          </div>
          <p className="text-xs text-white/30 font-body">
            &copy; {new Date().getFullYear()} Democracy Unlocked. Not affiliated with the U.S. Government.
          </p>
        </div>
      </footer>
    </div>
  )
}
