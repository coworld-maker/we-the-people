import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Clock, ArrowRight, ChevronRight, Lightbulb } from 'lucide-react'
import { CIVIC_CIVIC_GUIDES } from '@/lib/data/civic-guides'

export const metadata = {
  title: 'Learn | Democracy Unlocked',
  description: 'Civic education resources to help you understand how government works.',
}

export default async function LearnPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-5 py-8 sm:px-8 sm:py-10 mb-8 text-center">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3">
          Civic Education Hub
        </h1>
        <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Short, clear explainers on how government works, how laws are made,
          and how to make your voice count.
        </p>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <span className="badge bg-[--accent-light] text-[--accent]">{CIVIC_GUIDES.length} guides</span>
        <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">2-3 min reads</span>
        <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">Plain language</span>
      </div>

      {/* Guide grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {CIVIC_GUIDES.map(guide => (
          <Link key={guide.id} href={`/learn/${guide.id}`}
            className="card-interactive p-5 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${guide.bg} rounded-lg flex items-center justify-center border ${guide.border}`}>
                <guide.icon className={`w-4 h-4 ${guide.color}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">{guide.readTime}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider">{guide.category}</span>
            <h3 className="font-display text-base font-bold text-[--text] mb-1 group-hover:text-[--accent] transition-colors mt-1">
              {guide.title}
            </h3>
            <p className="text-sm text-[--text-secondary] leading-relaxed">{guide.desc}</p>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="card p-8 text-center bg-[--surface-secondary]">
        <Lightbulb className="w-8 h-8 text-[--accent] mx-auto mb-3 opacity-60" />
        <h3 className="font-display text-lg font-bold text-[--text] mb-2">Put your knowledge into practice</h3>
        <p className="text-sm text-[--text-secondary] mb-5 max-w-md mx-auto">
          Now that you understand how government works, start voting on real legislation
          and engaging with your representatives.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/bills" className="btn-primary">Browse bills <ArrowRight className="w-3.5 h-3.5" /></Link>
          <Link href="/action-center" className="btn-secondary">Civic Action Center <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </div>
    </div>
  )
}
