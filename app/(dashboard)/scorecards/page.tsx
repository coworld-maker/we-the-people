import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import {
  BarChart3, Users, ExternalLink, ArrowRight, TrendingUp,
  Search, Shield, Award, Building,
} from 'lucide-react'
import ScorecardSearch from '@/components/scorecards/ScorecardSearch'

export const metadata = {
  title: 'Official Scorecards | Democracy Unlocked',
  description: 'See how your elected officials vote and how they align with your views.',
}

export default async function ScorecardsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-8 py-10 mb-8">
        <div className="max-w-2xl">
          <div className="badge bg-white/10 text-white/60 border border-white/10 mb-4">Coming soon — Full Scorecards</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Elected Official Scorecards
          </h1>
          <p className="text-white/40 text-lg leading-relaxed">
            Track how your representatives vote, their attendance records, key positions,
            and how their votes align with your views.
          </p>
        </div>
      </div>

      {/* What's available now */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: Search,
            title: 'Find Your Officials',
            desc: 'Look up your Senators and House Representative by state.',
            status: 'Live',
            statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          },
          {
            icon: BarChart3,
            title: 'Voting Records',
            desc: 'See how officials voted on key legislation in Congress.',
            status: 'Coming soon',
            statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
          },
          {
            icon: TrendingUp,
            title: 'Alignment Score',
            desc: '"Your views match this official: 62%" — based on your votes vs. theirs.',
            status: 'Coming soon',
            statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
          },
          {
            icon: Award,
            title: 'Attendance Records',
            desc: 'Track how often officials show up for votes and committee hearings.',
            status: 'Coming soon',
            statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
          },
          {
            icon: Shield,
            title: 'Key Positions',
            desc: 'Where officials stand on major policy areas and hot-button issues.',
            status: 'Coming soon',
            statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
          },
          {
            icon: Users,
            title: 'Community Comparison',
            desc: 'See how your district\'s opinions compare to your rep\'s voting record.',
            status: 'Coming soon',
            statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
          },
        ].map(card => (
          <div key={card.title} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-[--accent-light] rounded-lg flex items-center justify-center">
                <card.icon className="w-4 h-4 text-[--accent]" />
              </div>
              <span className={`badge border ${card.statusColor}`}>{card.status}</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[--text] mb-1">{card.title}</h3>
            <p className="text-xs text-[--text-secondary] leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Search for officials */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-2">Look Up Officials</h2>
        <p className="text-sm text-[--text-secondary] mb-5">
          Select your state to see your current representatives in Congress.
        </p>
        <ScorecardSearch />
      </section>

      {/* How alignment scoring will work */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-4">How Alignment Scoring Works</h2>
        <div className="card p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'You vote on bills',
                desc: 'Cast your position on real legislation tracked on this platform.',
              },
              {
                step: '02',
                title: 'We track official votes',
                desc: 'We pull how your representatives actually voted on those same bills.',
              },
              {
                step: '03',
                title: 'We calculate alignment',
                desc: 'Your personal alignment score shows how often your rep agrees with you.',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-[--accent] text-white font-display text-xs font-bold rounded-full mb-3">
                  {item.step}
                </span>
                <h3 className="font-display text-sm font-bold text-[--text] mb-1">{item.title}</h3>
                <p className="text-xs text-[--text-secondary] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-[--surface-secondary] rounded-lg text-center">
            <p className="text-sm text-[--text-secondary]">
              Start voting on bills to build your alignment profile.
            </p>
            <a href="/bills" className="inline-flex items-center gap-1 text-sm font-semibold text-[--accent] mt-2 hover:text-[--accent-hover] transition-colors">
              Browse bills <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* External resources */}
      <section>
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-4">External Resources</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Congress.gov', desc: 'Official source for bill text, votes, and member info.', url: 'https://www.congress.gov' },
            { title: 'GovTrack.us', desc: 'Detailed voting records and bill tracking for Congress.', url: 'https://www.govtrack.us' },
            { title: 'OpenSecrets', desc: 'Campaign finance data and lobbying records.', url: 'https://www.opensecrets.org' },
            { title: 'VoteSmart', desc: 'Voting records, ratings, and positions for elected officials.', url: 'https://justfacts.votesmart.org' },
          ].map(resource => (
            <a key={resource.title} href={resource.url} target="_blank" rel="noopener noreferrer"
              className="card p-4 flex items-center gap-3 group lift"
            >
              <div className="w-9 h-9 bg-[--surface-secondary] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[--accent-light] transition-colors">
                <Building className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors">{resource.title}</h3>
                <p className="text-xs text-[--text-muted]">{resource.desc}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
