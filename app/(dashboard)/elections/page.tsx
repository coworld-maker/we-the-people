import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Vote, Calendar, MapPin, TrendingUp, ExternalLink, AlertCircle,
  ChevronRight, Users, BarChart3, Star, Clock, RefreshCw,
} from 'lucide-react'
import { CivicService } from '@/lib/services/civicService'
import { getSenateRaces } from '@/lib/api/fec'
import { formatRaised } from '@/lib/data/senateRaces'
import { abbrToName } from '@/lib/utils/state-codes'
import ElectionsClient from '@/components/elections/ElectionsClient'

export const metadata = {
  title: 'Elections',
  description: '2026 midterms, key races, runoffs, and upcoming elections across the United States.',
}

// Senate races come from FEC filings (getSenateRaces), not a hand-typed list:
// the old list had four wrong seats (a retired senator, two seats not up in
// 2026, and Ossoff marked as not running).

const KEY_GOV_RACES_2026 = [
  { state: 'TX', name: 'Texas', incumbent: 'Greg Abbott', party: 'R', rating: 'Safe R' },
  { state: 'FL', name: 'Florida', incumbent: 'Ron DeSantis', party: 'R', rating: 'Likely R', notes: 'Term-limited; open race' },
  { state: 'CA', name: 'California', incumbent: 'Gavin Newsom', party: 'D', rating: 'Safe D', notes: 'Newsom term-limited; open race' },
  { state: 'NY', name: 'New York', incumbent: 'Kathy Hochul', party: 'D', rating: 'Lean D' },
  { state: 'PA', name: 'Pennsylvania', incumbent: 'Josh Shapiro', party: 'D', rating: 'Likely D' },
  { state: 'GA', name: 'Georgia', incumbent: 'Brian Kemp', party: 'R', rating: 'Lean R', notes: 'Kemp term-limited; open race' },
  { state: 'MI', name: 'Michigan', incumbent: 'Gretchen Whitmer', party: 'D', rating: 'Lean D', notes: 'Whitmer term-limited; open race' },
  { state: 'AZ', name: 'Arizona', incumbent: 'Katie Hobbs', party: 'D', rating: 'Toss-up' },
]

const ELECTION_RESOURCES = [
  { label: 'Vote.gov', desc: 'Register and find your polling place', href: 'https://vote.gov', icon: Vote },
  { label: 'Ballotpedia', desc: 'Candidate profiles and ballot measures', href: 'https://ballotpedia.org', icon: BarChart3 },
  { label: 'Can I Vote?', desc: 'NASS voter registration lookup', href: 'https://www.nass.org/can-I-vote', icon: Users },
  { label: 'Google Elections', desc: 'Your personalized ballot info', href: 'https://elections.google.com', icon: MapPin },
]

const RACE_RATING_CLS: Record<string, string> = {
  'Safe R':    'bg-red-50 text-red-700 border-red-200',
  'Likely R':  'bg-red-50/60 text-red-600 border-red-200/60',
  'Lean R':    'bg-orange-50 text-orange-700 border-orange-200',
  'Toss-up':   'bg-amber-50 text-amber-700 border-amber-200',
  'Lean D':    'bg-blue-50/60 text-blue-600 border-blue-200/60',
  'Likely D':  'bg-blue-50 text-blue-700 border-blue-200',
  'Safe D':    'bg-blue-100 text-blue-800 border-blue-300',
}

const PARTY_CLS: Record<string, string> = {
  R: 'text-red-600 font-bold',
  D: 'text-blue-600 font-bold',
  I: 'text-gray-600 font-bold',
}

// Days until Nov 3, 2026 (general election day)
function daysUntilElection(): number {
  const electionDay = new Date('2026-11-03T00:00:00')
  const now = new Date()
  return Math.max(0, Math.ceil((electionDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export default async function ElectionsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const senate = await getSenateRaces('2026')
  const senateAsOf = senate?.races.map(r => r.asOf).filter((d): d is string => !!d).sort().at(-1) ?? null

  const configured = CivicService.isConfigured()
  const civicElections = configured ? await CivicService.getElections() : []
  const daysLeft = daysUntilElection()

  // Split into upcoming and past
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = civicElections.filter(e => e.electionDay >= today)
  const recent   = civicElections.filter(e => e.electionDay <  today).slice(-5).reverse()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Vote className="w-5 h-5 text-[--accent]" />
          <h1 className="font-display text-2xl font-extrabold text-[--text]">Elections</h1>
        </div>
        <p className="text-sm text-[--text-secondary]">
          2026 midterms, key races, runoffs, and how to make your vote count
        </p>
      </div>

      {/* Countdown banner */}
      <div className="hero-gradient rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Next General Election</p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-1">
              2026 Midterm Elections
            </h2>
            <p className="text-white/80 text-sm">November 3, 2026 · All 435 House seats · {senate?.races.length ?? 35} Senate races, incl. 2 specials · 36+ Governor races</p>
          </div>
          <div className="shrink-0 text-center bg-white/10 border border-white/20 rounded-2xl px-6 py-4 backdrop-blur-sm">
            <p className="font-display text-4xl font-extrabold text-white">{daysLeft.toLocaleString()}</p>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mt-1">days away</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap gap-3 mt-6">
          <a
            href="https://vote.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[--accent] rounded-full text-sm font-semibold hover:bg-white/90 transition-colors shadow-md"
          >
            Register to Vote <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://ballotpedia.org/2026_elections"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/25 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Full Race Guide <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Upcoming elections from Google Civic API */}
      <ElectionsClient
        upcoming={upcoming}
        recent={recent}
        configured={configured}
      />

      {/* 2026 Senate races — FEC filings, refreshed daily (lib/api/fec.ts).
          The FEC lists everyone who filed, including candidates who lost a
          primary or withdrew, so this is a fundraising view, not a ballot. */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="font-display text-lg font-bold text-[--text]">Senate Races — 2026</h2>
          {senate && (
            <span className="text-xs text-[--text-muted] ml-auto">{senate.races.length} races · FEC filings</span>
          )}
        </div>
        <p className="text-xs text-[--text-muted] mb-4 max-w-3xl">
          The top fundraisers who filed with the FEC for each seat, by money raised. This isn&apos;t a
          ballot: the FEC doesn&apos;t mark primary results, so it can include candidates who lost a
          primary or withdrew. Each race links to its full FEC page.
        </p>

        {!senate ? (
          <div className="card p-5 text-sm text-[--text-secondary]">
            FEC data couldn&apos;t be loaded right now. See{' '}
            <a
              href="https://www.fec.gov/data/elections/?cycle=2026&office=S"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--accent] font-semibold hover:underline"
            >
              2026 Senate races on fec.gov
            </a>.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-[--border]">
              {senate.races.map(race => (
                <a
                  key={race.state}
                  href={`https://www.fec.gov/data/elections/senate/${race.state}/2026/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 px-5 py-3.5 hover:bg-[--surface-secondary] transition-colors"
                >
                  <div className="w-10 h-10 bg-[--surface-secondary] rounded-xl flex items-center justify-center shrink-0 font-display font-extrabold text-sm text-[--accent] group-hover:bg-[--accent-light] transition-colors">
                    {race.state}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors">
                        {abbrToName(race.state) ?? race.state}
                      </span>
                      {race.openSeat && (
                        <span className="badge border text-[10px] font-semibold bg-[--surface-secondary] text-[--text-secondary] border-[--border]">
                          Open seat
                        </span>
                      )}
                    </div>
                    {race.candidates.length > 0 ? (
                      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[--text-secondary]">
                        {race.candidates.map(c => (
                          <li key={c.id}>
                            <span className="font-medium text-[--text]">{c.name}</span>{' '}
                            <span className={PARTY_CLS[c.party] ?? 'text-gray-600 font-bold'}>({c.party})</span>
                            {c.incumbent && <span className="text-[--text-muted]"> · incumbent</span>}
                            <span className="text-[--text-muted]"> · {formatRaised(c.raised)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[--text-muted] mt-1">No candidate has reported $100K raised yet.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-[10px] text-[--text-muted]">{race.filedCount} filed</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {senate && (
          <p className="text-[10px] text-[--text-muted] mt-2">
            Source: Federal Election Commission, refreshed daily
            {senateAsOf ? `; reports through ${senateAsOf}` : ''}.
            {senate.missing.length > 0 && ` Couldn't load: ${senate.missing.join(', ')}.`}
          </p>
        )}
      </section>

      {/* Key Governor races */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-purple-500" />
          <h2 className="font-display text-lg font-bold text-[--text]">Key Governor Races — 2026</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {KEY_GOV_RACES_2026.map(race => (
            <a
              key={race.state}
              href={`https://ballotpedia.org/Gubernatorial_election_in_${race.name.replace(/ /g, '_')},_2026`}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex items-center gap-3 p-4 hover:border-[--accent] transition-all"
            >
              <div className="w-10 h-10 bg-[--surface-secondary] rounded-xl flex items-center justify-center shrink-0 font-display font-extrabold text-sm text-purple-600 group-hover:bg-purple-50 transition-colors">
                {race.state}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors">
                    {race.name}
                  </span>
                  <span className={`text-[10px] ${PARTY_CLS[race.party] ?? ''}`}>({race.party})</span>
                </div>
                {race.notes && (
                  <p className="text-[10px] text-[--text-muted] mt-0.5">{race.notes}</p>
                )}
              </div>
              <span className={`badge border text-[10px] font-semibold shrink-0 ${RACE_RATING_CLS[race.rating] ?? ''}`}>
                {race.rating}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* House overview */}
      <section className="mb-8">
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-base font-bold text-[--text] mb-1">U.S. House of Representatives — 2026</h2>
              <p className="text-sm text-[--text-secondary] mb-4">
                All 435 seats are on the ballot. Republicans currently hold a slim majority. Historically,
                the party in the White House loses House seats in midterm elections.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total seats', value: '435', color: 'text-[--text]' },
                  { label: 'To flip House', value: '218', color: 'text-[--text]' },
                  { label: 'R seats (est.)', value: '220', color: 'text-red-600' },
                  { label: 'D seats (est.)', value: '215', color: 'text-blue-600' },
                ].map(s => (
                  <div key={s.label} className="bg-[--surface-secondary] rounded-lg p-3 text-center">
                    <p className={`font-display text-xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-[--text-muted] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <a
                href="https://ballotpedia.org/United_States_House_of_Representatives_elections,_2026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[--accent] font-semibold hover:underline"
              >
                View all House races on Ballotpedia <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="mb-8">
        <h2 className="font-display text-lg font-bold text-[--text] mb-4">Election Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ELECTION_RESOURCES.map(res => (
            <a
              key={res.label}
              href={res.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex items-center gap-4 p-5 hover:border-[--accent] transition-all"
            >
              <div className="w-10 h-10 bg-[--accent-light] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <res.icon className="w-5 h-5 text-[--accent]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors">{res.label}</p>
                <p className="text-xs text-[--text-muted]">{res.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Senate candidates and money raised come from FEC filings. Governor race ratings are hand-entered
          estimates from public forecasters (Cook Political Report, Sabato's Crystal Ball) and change frequently. Democracy Unlocked is not affiliated with any campaign or party.
          Always verify voter registration and polling place info through your state's official election authority.
        </p>
      </div>
    </div>
  )
}
