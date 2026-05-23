import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import {
  BarChart3, Users, ExternalLink, ArrowRight, TrendingUp,
  Search, Shield, Award, Building, CheckCircle,
} from 'lucide-react'
import ScorecardSearch from '@/components/scorecards/ScorecardSearch'
import SectionNav from '@/components/ui/SectionNav'
import USPartyMap from '@/components/representatives/USPartyMap'

export const metadata = {
  title: 'Scorecards | Democracy Unlocked',
  description: 'See how your elected officials vote and how they align with your views.',
}

const SECTIONS = [
  { id: 'national',     label: 'National Map' },
  { id: 'search',       label: 'Find Officials' },
  { id: 'features',     label: 'What\'s Included' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'resources',    label: 'Resources' },
]

const FEATURES = [
  {
    icon: Search,
    title: 'Find Your Officials',
    desc: 'Look up your Senators and House Representatives by state — instantly.',
    live: true,
  },
  {
    icon: BarChart3,
    title: 'Voting Records',
    desc: 'Every recorded roll call vote for the 119th Congress, searchable and filterable.',
    live: true,
  },
  {
    icon: TrendingUp,
    title: 'Alignment Score',
    desc: '"Your views match this official: 62%" — calculated from your votes vs. theirs.',
    live: true,
  },
  {
    icon: Shield,
    title: 'Key Positions',
    desc: 'Policy-area breakdown — how often does your rep vote Yea vs. Nay by topic?',
    live: true,
  },
  {
    icon: Users,
    title: 'Community Comparison',
    desc: 'See how your rep voted vs. how Democracy Unlocked users voted on the same bills.',
    live: true,
  },
  {
    icon: Award,
    title: 'Attendance Records',
    desc: 'Track how often officials show up for votes and committee hearings.',
    live: false,
  },
]

export default async function ScorecardsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-8 py-10 mb-8">
        <div className="max-w-2xl">
          <div className="badge bg-white/10 text-white/80 border border-white/10 mb-4">
            Full scorecards now live
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Elected Official Scorecards
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Track how your representatives vote, see their alignment with your views,
            and compare them against the broader Democracy Unlocked community.
          </p>
        </div>
      </div>

      {/* Section nav */}
      <SectionNav sections={SECTIONS} />

      {/* National party-makeup map */}
      <section id="national" className="scroll-mt-20 mb-12">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-2">National Map</h2>
        <p className="text-sm text-[--text-secondary] mb-6">
          See the current makeup of Congress at a glance. Each state is colored by its House
          delegation's lean (red → purple → blue). Click any state to drill into its activity.
        </p>
        <USPartyMap />
      </section>

      {/* Search */}
      <section id="search" className="scroll-mt-20 mb-12">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-2">Find Your Officials</h2>
        <p className="text-sm text-[--text-secondary] mb-6">
          Select your state to look up your current senators and house representative.
          Click "View Full Scorecard" to see their complete voting record, alignment score, and more.
        </p>
        <ScorecardSearch />
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 mb-12">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-2">What's Included</h2>
        <p className="text-sm text-[--text-secondary] mb-6">
          Every scorecard is built from real congressional data — no estimates, no grades from interest groups.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(card => (
            <div key={card.title} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-[--accent-light] rounded-lg flex items-center justify-center">
                  <card.icon className="w-4 h-4 text-[--accent]" />
                </div>
                {card.live ? (
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Live
                  </span>
                ) : (
                  <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">
                    Coming soon
                  </span>
                )}
              </div>
              <h3 className="font-display text-sm font-bold text-[--text] mb-1">{card.title}</h3>
              <p className="text-xs text-[--text-secondary] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 mb-12">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-2">How Alignment Scoring Works</h2>
        <p className="text-sm text-[--text-secondary] mb-6">
          Your alignment score is calculated automatically as you vote on bills.
        </p>
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
                desc: 'We pull how your representatives actually voted on those same bills from Congress.gov.',
              },
              {
                step: '03',
                title: 'We calculate alignment',
                desc: 'Your personal alignment % shows how often your rep agrees with you — bill by bill.',
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
              The more bills you vote on, the more accurate your alignment score becomes.
            </p>
            <a href="/bills" className="inline-flex items-center gap-1 text-sm font-semibold text-[--accent] mt-2 hover:text-[--accent-hover] transition-colors">
              Browse bills <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* External resources */}
      <section id="resources" className="scroll-mt-20">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-2">External Resources</h2>
        <p className="text-sm text-[--text-secondary] mb-6">
          Primary sources we use to build scorecards — go deeper with these.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Congress.gov',  desc: 'Official source for bill text, votes, and member info.',          url: 'https://www.congress.gov' },
            { title: 'GovTrack.us',   desc: 'Detailed voting records and bill tracking for Congress.',          url: 'https://www.govtrack.us' },
            { title: 'OpenSecrets',   desc: 'Campaign finance data and lobbying records.',                       url: 'https://www.opensecrets.org' },
            { title: 'VoteSmart',     desc: 'Voting records, ratings, and positions for elected officials.',     url: 'https://justfacts.votesmart.org' },
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
