/**
 * /ballot/[code] — "What's on your ballot in <state>", one public page per
 * state for the Nov 3, 2026 federal election.
 *
 * Google is the only thing currently bringing strangers to the site, and
 * "what's on my ballot in X" is what people search in the closing weeks. Every
 * figure here comes from what the site already holds: the member roster for
 * House seats and sitting senators, FEC filings for Senate candidates, and the
 * hand-checked governor nominees and three-forecaster race ratings.
 *
 * It is deliberately NOT a ballot: FEC filings include people who lost
 * primaries, and no federal source carries state or local contests. The
 * official sources sit at the top of the page, before anything we assembled.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Vote, Landmark, Users, CalendarDays, ArrowRight } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getSenateRaces } from '@/lib/api/fec'
import { formatRaised } from '@/lib/data/senateRaces'
import { governorRaceFor } from '@/lib/data/governorRaces'
import { senateRatingsFor } from '@/lib/data/forecasts'
import ForecastRatings, { ForecastSources } from '@/components/elections/ForecastRatings'
import { buildStateBallot, ballotSummary, daysUntilElection } from '@/lib/data/ballot'
import { ABBR_TO_NAME, abbrToName } from '@/lib/utils/state-codes'

// Re-rendered hourly: FEC totals and the member roster change daily at most.
export const revalidate = 3600

export async function generateStaticParams() {
  return Object.keys(ABBR_TO_NAME).map(code => ({ code: code.toLowerCase() }))
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const name = abbrToName(code)
  if (!name) return { title: 'Ballot' }
  return {
    title: `What's on your ballot in ${name}`,
    description: `The federal races ${name} votes on November 3, 2026 — U.S. House seats, any U.S. Senate race, and the governor's office — with links to ${name}'s official election information.`,
  }
}

const PARTY_CLS: Record<string, string> = {
  R: 'text-red-600 font-bold',
  D: 'text-blue-600 font-bold',
  I: 'text-gray-600 font-bold',
}

export default async function StateBallotPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = raw.toUpperCase()
  const stateName = abbrToName(code)
  if (!stateName) notFound()

  const [members, senateData] = await Promise.all([
    prisma.representative
      .findMany({
        where: { currentTerm: true, state: stateName },
        select: { bioguideId: true, fullName: true, party: true, district: true, chamber: true },
      })
      .catch(() => []),
    getSenateRaces('2026').catch(() => null),
  ])

  const house = members
    .filter(m => m.chamber === 'House')
    .sort((a, b) => Number(a.district ?? 0) - Number(b.district ?? 0))
  const senators = members.filter(m => m.chamber === 'Senate')

  const ballot = buildStateBallot({
    code,
    name: stateName,
    houseSeats: house.length,
    senate: senateData?.races.find(r => r.state === code) ?? null,
    governor: governorRaceFor(code) ?? null,
  })
  const days = daysUntilElection()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="hero-gradient rounded-2xl px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-2 mb-1">
          <Vote className="w-5 h-5 text-white/80" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {days > 0 ? `${days} days away` : 'Election day'}
          </span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white mb-2">
          What&rsquo;s on your ballot in {stateName}
        </h1>
        <p className="text-sm text-white/75">{ballotSummary(ballot)}</p>
      </div>

      {/* Official sources first — this page never claims to be the ballot. */}
      <div className="card p-5">
        <h2 className="font-display text-sm font-bold text-[--text] mb-1">Your official ballot and polling place</h2>
        <p className="text-xs text-[--text-muted] mb-3">
          Only your state election office can tell you the full ballot, including state and local
          contests and ballot measures. Start here:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { href: 'https://vote.gov', label: 'Vote.gov', desc: 'Register, check your registration' },
            { href: 'https://www.nass.org/can-I-vote', label: 'Can I Vote?', desc: 'Your state election office' },
            { href: 'https://ballotpedia.org', label: 'Ballotpedia', desc: 'Sample ballots, measures' },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[--border] px-3 py-2.5 hover:border-[--accent]/40 transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-1 text-xs font-semibold text-[--accent]">
                {l.label} <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </span>
              <span className="block text-[11px] text-[--text-muted]">{l.desc}</span>
            </a>
          ))}
        </div>
      </div>

      {ballot.senate && (
        <div className="card p-5">
          <h2 className="font-display text-sm font-bold text-[--text] mb-1">U.S. Senate</h2>
          <p className="text-xs text-[--text-muted] mb-3">
            Candidates who filed with the FEC, by money raised
            {ballot.senate.asOf ? ` (reports through ${ballot.senate.asOf})` : ''}. This is not a
            ballot: the FEC doesn&rsquo;t mark primary results, so it can include candidates who lost
            or withdrew. {ballot.senate.filedCount} filed in total.
          </p>
          <ul className="space-y-1.5">
            {ballot.senate.candidates.map(c => (
              <li key={c.id} className="text-sm text-[--text-secondary]">
                {c.name} <span className={PARTY_CLS[c.party] ?? 'text-gray-600 font-bold'}>({c.party})</span>
                {c.incumbent && <span className="text-[--text-muted]"> · incumbent</span>}
                {c.raised > 0 && <span className="text-[--text-muted]"> · {formatRaised(c.raised)}</span>}
              </li>
            ))}
          </ul>
          {senateRatingsFor(code) && (
            <div className="mt-3 space-y-1">
              <ForecastRatings ratings={senateRatingsFor(code)!} />
              <ForecastSources office="senate" />
            </div>
          )}
        </div>
      )}

      {ballot.governor && (
        <div className="card p-5">
          <h2 className="font-display text-sm font-bold text-[--text] mb-1">Governor</h2>
          <p className="text-sm font-semibold text-[--text] mb-1">
            {ballot.governor.candidates.map(c => `${c.name} (${c.party})`).join(' vs. ')}
          </p>
          <p className="text-sm text-[--text-secondary] mb-2">{ballot.governor.notes}.</p>
          <ForecastRatings ratings={ballot.governor.ratings} />
          <p className="text-[11px] text-[--text-muted] mt-2">
            Democratic and Republican nominees shown; third-party and independent candidates may
            also be on your ballot.
          </p>
          <div className="mt-1">
            <ForecastSources office="governor" />
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Landmark className="w-4 h-4 text-[--accent]" aria-hidden="true" />
          <h2 className="font-display text-sm font-bold text-[--text]">
            U.S. House — {ballot.houseSeats === 1 ? 'the seat is' : `all ${ballot.houseSeats} seats are`} on the ballot
          </h2>
        </div>
        <p className="text-xs text-[--text-muted] mb-3">
          Every House seat is elected every two years. These are the members serving {stateName} now —
          see how each voted before you decide.
        </p>
        <ul className="divide-y divide-[--border]">
          {house.map(m => (
            <li key={m.bioguideId}>
              <Link
                href={`/scorecards/${m.bioguideId}`}
                className="flex items-center justify-between gap-2 py-2.5 min-h-[44px] group"
              >
                <span className="text-sm text-[--text]">
                  {m.district ? `District ${m.district}` : 'At-large'} · {m.fullName}{' '}
                  <span className={PARTY_CLS[m.party] ?? 'text-gray-600 font-bold'}>({m.party})</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
          {!house.length && (
            <li className="py-2 text-sm text-[--text-muted]">No House members on file for {stateName}.</li>
          )}
        </ul>
      </div>

      {senators.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[--accent]" aria-hidden="true" />
            <h2 className="font-display text-sm font-bold text-[--text]">Your senators now</h2>
          </div>
          <p className="text-xs text-[--text-muted] mb-3">
            Senate terms last six years, so only one seat per state is up in any given election.
          </p>
          <ul className="divide-y divide-[--border]">
            {senators.map(s => (
              <li key={s.bioguideId}>
                <Link
                  href={`/scorecards/${s.bioguideId}`}
                  className="flex items-center justify-between gap-2 py-2.5 min-h-[44px] group"
                >
                  <span className="text-sm text-[--text]">
                    {s.fullName} <span className={PARTY_CLS[s.party] ?? 'text-gray-600 font-bold'}>({s.party})</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-4 h-4 text-[--accent]" aria-hidden="true" />
          <h2 className="font-display text-sm font-bold text-[--text]">Before you vote</h2>
        </div>
        <p className="text-sm text-[--text-secondary] mb-3">
          Read the bills your representatives actually voted on — the full text and the roll calls,
          not campaign material. No account needed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/bills" className="btn-primary text-xs px-4 py-2">Browse bills</Link>
          <Link
            href="/elections"
            className="text-xs font-semibold text-[--accent] inline-flex items-center min-h-[44px] px-2 hover:underline"
          >
            All 2026 races <ArrowRight className="w-3 h-3 ml-1" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <p className="text-xs text-[--text-muted] text-center px-4">
        Democracy Unlocked is not affiliated with any campaign, party or election authority. This page
        lists federal races only — your actual ballot also carries state and local contests.
      </p>
    </div>
  )
}
