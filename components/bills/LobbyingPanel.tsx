import prisma from '@/lib/prisma'
import { ExternalLink, DollarSign, Users, AlertCircle } from 'lucide-react'
import { getTopDonorsForCandidate } from '@/lib/api/fec'
import { getLobbyingForBill, ldaVerifyUrl } from '@/lib/api/lda'

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default async function LobbyingPanel({ bill }: { bill: any }) {
  const sponsors: any[] = Array.isArray(bill.sponsors) ? bill.sponsors : []
  const billType: string = bill.billType || ''
  const billNumber: string = String(bill.billNumber || '')
  // Required: bill numbers repeat each Congress, so filings must be year-scoped
  // or we attribute a previous Congress's lobbying to this bill.
  const congress: string = String(bill.congress || '')

  // --- Section B: LDA lobbying filings (always attempt) ---
  // null = lookup failed (rate-limited/unreachable), [] = checked, none found.
  // These must render differently — see the panel body below.
  const ldaResult = billType && billNumber
    ? await getLobbyingForBill(billType, billNumber, congress).catch(() => null)
    : { filings: [], total: 0 }
  const ldaUnavailable = ldaResult === null
  const filings = ldaResult?.filings ?? []
  // Distinct firm+client pairs that matched, before the display cap. Deliberately
  // the LIVE total from the same fetch that produced these rows, not the stored
  // bill.lobbyingFirmCount that TrustBar renders — a stale stored value would
  // caption these rows with a number they don't belong to.
  const totalFilings = ldaResult?.total ?? 0
  const truncated = totalFilings > filings.length

  // --- Section A: FEC donor data for sponsors ---
  const bioguideIds = sponsors.map((s: any) => s.bioguideId).filter(Boolean)
  const reps = bioguideIds.length > 0
    ? await prisma.representative.findMany({
        where: { bioguideId: { in: bioguideIds } },
        select: {
          bioguideId: true, fullName: true, party: true,
          state: true, chamber: true, fecIds: true, fecCommitteeIds: true,
        },
      })
    : []

  type SponsorEntry = {
    name: string; party: string; state: string; chamber: string
    fecIds: string[]; fecCommitteeIds: string[]; searchUrl: string
  }
  const entries: SponsorEntry[] = []
  const matched = new Set<string>()

  reps.forEach((rep: typeof reps[number]) => {
    matched.add(rep.bioguideId)
    entries.push({
      name: rep.fullName,
      party: rep.party,
      state: rep.state,
      chamber: rep.chamber,
      fecIds: rep.fecIds,
      fecCommitteeIds: rep.fecCommitteeIds,
      searchUrl: `https://www.opensecrets.org/search?q=${encodeURIComponent(rep.fullName)}&type=1`,
    })
  })

  sponsors.forEach((s: any) => {
    if (s.bioguideId && matched.has(s.bioguideId)) return
    const name = s.fullName || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()
    if (!name) return
    entries.push({
      name,
      party: s.party ?? '?',
      state: s.state ?? '',
      chamber: '',
      fecIds: [],
      fecCommitteeIds: [],
      searchUrl: `https://www.opensecrets.org/search?q=${encodeURIComponent(name)}&type=1`,
    })
  })

  // Fetch FEC donors for each sponsor (parallel, fail-silent)
  const fecResults = await Promise.all(
    entries.map(e =>
      e.fecIds.length > 0 || e.fecCommitteeIds.length > 0
        ? getTopDonorsForCandidate(e.fecIds, e.fecCommitteeIds).catch(() => null)
        : Promise.resolve(null)
    )
  )

  const hasFECData = fecResults.some(r => r !== null)
  const hasAnything = entries.length > 0 || filings.length > 0 || ldaUnavailable
  if (!hasAnything) return null

  const hasFecKey = !!process.env.OPEN_FEC_API_KEY

  return (
    <div className="space-y-4">
      {/* Section A: Who funds the sponsors */}
      {entries.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              {/* "Who funds the sponsors?" on a bill page invited the reading that
                  this money is tied to THIS bill. It is general campaign money for
                  a whole election cycle. */}
              <h3 className="font-display text-sm font-bold text-[--text]">Who funds the sponsors&apos; campaigns?</h3>
              <p className="text-[11px] text-[--text-muted] mt-0.5">Individual contributions, grouped by employer · FEC</p>
            </div>
          </div>

          <div className="divide-y divide-[--border]">
            {entries.map((entry, i) => {
              const fec = fecResults[i]
              return (
                <div key={i} className="px-5 py-3.5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${entry.party === 'R' ? 'bg-red-500' : entry.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                      {(entry.party || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[--text] truncate">{entry.name}</p>
                      <p className="text-[10px] text-[--text-muted]">
                        {/* stored capitalized ("Senate"/"House") — lowercase compare rendered blank */}
                        {entry.chamber?.toLowerCase() === 'senate' ? 'Senator' : entry.chamber?.toLowerCase() === 'house' ? 'Rep.' : ''}
                        {entry.state ? ` · ${entry.state}` : ''}
                      </p>
                    </div>
                    <a href={entry.searchUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-[--accent] hover:text-[--accent-hover] font-semibold shrink-0 transition-colors">
                      OpenSecrets <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {fec && fec.donors.length > 0 ? (
                    <div className="ml-10 space-y-1">
                      {/* The employer is a GROUPING KEY for individual contributors,
                          not a donor — companies cannot give to federal candidates at
                          all. Rendered as "LOCKHEED MARTIN  $47,000" in bold amber this
                          read as "Lockheed Martin donated $47,000", which is not merely
                          misleading but legally impossible.

                          The qualifier is identical for every row, so it belongs in this
                          header at readable weight rather than repeated five times as
                          fine print. The per-row slot carries `count` instead: showing
                          that a total is made of many separate gifts is itself the
                          corrective, and the API already provided it. */}
                      <p className="text-[10px] text-[--text-secondary] font-semibold uppercase tracking-wide">
                        Where their individual donors work · {fec.cycle} cycle
                      </p>
                      <p className="text-[10px] text-[--text-muted] leading-tight mb-1.5">
                        Money from people who work there, not from the company. Not tied to this bill.
                      </p>
                      {fec.donors.slice(0, 5).map((d, j) => (
                        <div key={j} className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] text-[--text-secondary] truncate">{d.employer}</span>
                          {/* Count sits inline, immediately left of the money, so it
                              qualifies the figure at the same visual weight (a footer
                              cannot). Stacking it under the amount was tried and
                              rejected: it made every row three lines, repeated
                              "contributions" down the whole column, and floated each
                              caption toward the NEXT employer. */}
                          <span className="shrink-0 whitespace-nowrap">
                            <span className="text-[9px] text-[--text-muted]">{d.count.toLocaleString()} donations</span>
                            <span className="text-[11px] font-medium text-[--text-secondary] ml-1.5">{fmt(d.total)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : hasFecKey && entry.fecIds.length > 0 ? (
                    <p className="ml-10 text-[10px] text-[--text-muted]">No donor data found for current cycle</p>
                  ) : !hasFecKey ? (
                    <p className="ml-10 text-[10px] text-[--text-muted]">
                      Add <code className="bg-[--surface-secondary] px-1 rounded">OPEN_FEC_API_KEY</code> to enable donor data
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="px-5 py-3 border-t border-[--border]">
            <p className="text-[10px] text-[--text-muted]">
              Itemized individual contributions via FEC, grouped by the employer each contributor
              self-reported. Companies and unions cannot contribute to federal candidates from their
              treasuries, so these totals are money from people who work at an employer — never from
              the organization itself. They are campaign contributions covering a full election cycle
              and are not connected to this bill.
            </p>
          </div>
        </div>
      )}

      {/* Section B: Who's lobbying this bill */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500 shrink-0" />
          <div>
            <h3 className="font-display text-sm font-bold text-[--text]">Who's lobbying this bill?</h3>
            {/* The truncation notice sits here, not in the footer: it defines what
                the list below IS, so it has to be read before the rows. Ten rows
                under a "32 lobbying firms" badge with the gap explained only in
                fine print reads as one of the two numbers being wrong. */}
            <p className="text-[11px] text-[--text-muted] mt-0.5">
              Senate LDA lobbying disclosures
              {truncated && ` · showing ${filings.length} of ${totalFilings}`}
            </p>
          </div>
        </div>

        {filings.length > 0 ? (
          <>
            <div className="divide-y divide-[--border]">
              {filings.map((filing, i) => (
                <div key={i} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[--text] truncate">{filing.client}</p>
                      <p className="text-[11px] text-[--text-muted] truncate">via {filing.registrant}</p>
                      {filing.description && (
                        <p className="text-[10px] text-[--text-secondary] mt-1 line-clamp-2">{filing.description}</p>
                      )}
                    </div>
                    {/* This figure is the filer's TOTAL reported lobbying money for
                        the whole reporting period, across every issue and bill in the
                        filing — it is NOT spend attributable to this bill. Rendered
                        bare and bold it read as "$1.2M was spent lobbying this bill",
                        which is false. Keep it de-emphasized and always captioned. */}
                    {(filing.income || filing.expenses) && (
                      <div className="shrink-0 text-right max-w-[88px]">
                        <span className="text-[11px] font-medium text-[--text-secondary] whitespace-nowrap">
                          {fmt(filing.income || filing.expenses || 0)}
                        </span>
                        {/* Break is explicit: left to wrap, "all issues" orphans its
                            last word and the caption stops reading as one phrase. */}
                        <p className="text-[9px] text-[--text-muted] leading-tight mt-0.5">
                          {filing.period ? `${filing.period} total` : 'Period total'}
                          <br />all issues
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[--border] space-y-1.5">
              <p className="text-[10px] text-[--text-muted]">
                Firms whose LDA filings mention this bill. One filing covers many bills — read as disclosed interest, not confirmed lobbying on this bill alone.
                Dollar amounts are each filer&apos;s total reported lobbying money for that reporting period across every issue in the filing. No public data breaks lobbying spending out by bill, so none of these figures is the amount spent on this bill.
              </p>
              <a href={ldaVerifyUrl(billType, billNumber, congress)}
                target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[--accent] hover:text-[--accent-hover] transition-colors flex items-center gap-1">
                {truncated
                  ? `See all ${totalFilings} filings on the Senate LDA database`
                  : 'Verify these filings on the Senate LDA database'} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        ) : (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-[--text-muted] shrink-0" />
              <p className="text-xs text-[--text-muted]">
                {ldaUnavailable
                  ? "Couldn't load lobbying disclosures right now."
                  : "No lobbying disclosures matched this bill."}
              </p>
            </div>
            <a href={ldaVerifyUrl(billType, billNumber, congress)}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-[--accent] hover:text-[--accent-hover] transition-colors flex items-center gap-1 ml-6">
              Search the Senate LDA database yourself <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
