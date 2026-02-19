import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import {
  BarChart3, Users, Vote, MessageSquare, FileText, TrendingUp,
  Shield, Eye, Clock, CheckCircle2,
} from 'lucide-react'

export const metadata = {
  title: 'Transparency Dashboard | Democracy Unlocked',
  description: 'Platform statistics, engagement metrics, and data transparency.',
}

export default async function TransparencyPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Gather all platform stats from existing data
  const [
    totalUsers,
    totalVotes,
    totalDiscussions,
    totalBills,
    billsWithAI,
    votesByPosition,
    topPolicyAreas,
    recentUsers,
    votesLast7Days,
    votesLast30Days,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vote.count(),
    prisma.discussion.count(),
    prisma.bill.count(),
    prisma.bill.count({ where: { aiSummary: { not: null } } }),
    prisma.vote.groupBy({ by: ['position'], _count: { position: true } }),
    prisma.bill.groupBy({
      by: ['policyArea'],
      where: { policyArea: { not: null } },
      _count: { policyArea: true },
      orderBy: { _count: { policyArea: 'desc' } },
      take: 8,
    }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.vote.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.vote.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
  ])

  const yesVotes = votesByPosition.find(v => v.position === 'yes')?._count.position || 0
  const noVotes = votesByPosition.find(v => v.position === 'no')?._count.position || 0
  const abstainVotes = votesByPosition.find(v => v.position === 'abstain')?._count.position || 0
  const avgVotesPerBill = totalBills > 0 ? (totalVotes / totalBills).toFixed(1) : '0'
  const aiCoverage = totalBills > 0 ? Math.round((billsWithAI / totalBills) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-8 py-10 mb-8 text-center">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Transparency Dashboard
        </h1>
        <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
          Full visibility into platform engagement, data sources, and methodology.
          We believe trust is built through transparency.
        </p>
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Registered citizens', value: totalUsers.toLocaleString(), accent: 'text-[--accent]' },
          { icon: Vote, label: 'Votes cast', value: totalVotes.toLocaleString(), accent: 'text-emerald-600' },
          { icon: MessageSquare, label: 'Discussion comments', value: totalDiscussions.toLocaleString(), accent: 'text-purple-600' },
          { icon: FileText, label: 'Bills tracked', value: totalBills.toLocaleString(), accent: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-[--text-muted]" />
              <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`font-display text-2xl font-extrabold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Vote breakdown */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[--border]">
            <h2 className="font-display text-sm font-bold text-[--text]">Platform-wide vote breakdown</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Yes', count: yesVotes, pct: totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0, color: '#22C55E' },
              { label: 'No', count: noVotes, pct: totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 0, color: '#E5484D' },
              { label: 'Abstain', count: abstainVotes, pct: totalVotes > 0 ? Math.round((abstainVotes / totalVotes) * 100) : 0, color: '#8A8F98' },
            ].map(v => (
              <div key={v.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-[--text]">{v.label}</span>
                  <span className="text-sm font-semibold" style={{ color: v.color }}>
                    {v.pct}% <span className="text-[--text-muted] font-normal">({v.count.toLocaleString()})</span>
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[--surface-tertiary] overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${v.pct}%`, backgroundColor: v.color }} />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-[--border]">
              <p className="text-xs text-[--text-muted]">
                Total: <span className="font-semibold text-[--text]">{totalVotes.toLocaleString()}</span> votes across <span className="font-semibold text-[--text]">{totalBills}</span> bills
              </p>
            </div>
          </div>
        </div>

        {/* Policy area engagement */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[--border]">
            <h2 className="font-display text-sm font-bold text-[--text]">Bills by policy area</h2>
          </div>
          <div className="p-6 space-y-3">
            {topPolicyAreas.length > 0 ? topPolicyAreas.map((area, i) => {
              const max = topPolicyAreas[0]._count.policyArea
              return (
                <div key={area.policyArea}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[--text] font-medium truncate max-w-[70%]">{area.policyArea}</span>
                    <span className="text-sm font-semibold text-[--accent]">{area._count.policyArea}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[--surface-tertiary] overflow-hidden">
                    <div className="h-2 rounded-full bg-[--accent] transition-all duration-500"
                      style={{ width: `${(area._count.policyArea / max) * 100}%`, opacity: 1 - i * 0.1 }} />
                  </div>
                </div>
              )
            }) : (
              <p className="text-sm text-[--text-muted] text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Avg. votes per bill', value: avgVotesPerBill, icon: TrendingUp },
          { label: 'AI analysis coverage', value: `${aiCoverage}%`, icon: BarChart3 },
          { label: 'Votes (last 7 days)', value: votesLast7Days.toLocaleString(), icon: Clock },
          { label: 'New users (7 days)', value: recentUsers.toLocaleString(), icon: Users },
        ].map(m => (
          <div key={m.label} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="w-4 h-4 text-[--text-muted]" />
              <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="font-display text-xl font-extrabold text-[--text]">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Trust & methodology */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-4">Trust &amp; methodology</h2>
        <div className="space-y-3">
          {[
            { icon: Shield, title: 'Data privacy', desc: 'Individual votes are anonymous. We aggregate data for public statistics but never expose personal voting records.' },
            { icon: Eye, title: 'AI transparency', desc: 'All AI-generated content is clearly labeled. Summaries link to original bill text so you can verify claims.' },
            { icon: CheckCircle2, title: 'Data sources', desc: 'Bill data comes directly from the Congress.gov API. We do not modify or editorialize legislative text.' },
            { icon: Users, title: 'No astroturfing', desc: 'One account per person. Votes are rate-limited and monitored for suspicious patterns.' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-4 p-5 bg-[--surface-secondary] rounded-xl">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 border border-[--border]">
                <item.icon className="w-4 h-4 text-[--accent]" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[--text] mb-1">{item.title}</h3>
                <p className="text-sm text-[--text-secondary] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Open data notice */}
      <div className="card p-6 text-center bg-[--surface-secondary]">
        <BarChart3 className="w-8 h-8 text-[--accent] mx-auto mb-3 opacity-60" />
        <h3 className="font-display text-base font-bold text-[--text] mb-2">Open data commitment</h3>
        <p className="text-sm text-[--text-secondary] max-w-lg mx-auto">
          We believe civic data should be accessible. Aggregated, anonymous engagement
          statistics will be made available through a public API in the future.
        </p>
      </div>
    </div>
  )
}
