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

  // --- Section B: LDA lobbying filings (always attempt) ---
  const ldaFilings = billType && billNumber
    ? await getLobbyingForBill(billType, billNumber).catch(() => [])
    : []

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
  const hasAnything = entries.length > 0 || ldaFilings.length > 0
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
              <h3 className="font-display text-sm font-bold text-[--text]">Who funds the sponsors?</h3>
              <p className="text-[11px] text-[--text-muted] mt-0.5">Individual donor employers · FEC data</p>
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
                        {entry.chamber === 'senate' ? 'Senator' : entry.chamber === 'house' ? 'Rep.' : ''}
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
                      <p className="text-[10px] text-[--text-muted] font-semibold uppercase tracking-wide mb-1.5">
                        Top donor employers · {fec.cycle} cycle
                      </p>
                      {fec.donors.slice(0, 5).map((d, j) => (
                        <div key={j} className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[--text-secondary] truncate">{d.employer}</span>
                          <span className="text-[11px] font-semibold text-amber-600 shrink-0">{fmt(d.total)}</span>
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
              Individual donor data via FEC. Employers self-reported. Figures show itemized contributions.
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
            <p className="text-[11px] text-[--text-muted] mt-0.5">Senate LDA lobbying disclosures</p>
          </div>
        </div>

        {ldaFilings.length > 0 ? (
          <>
            <div className="divide-y divide-[--border]">
              {ldaFilings.map((filing, i) => (
                <div key={i} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[--text] truncate">{filing.client}</p>
                      <p className="text-[11px] text-[--text-muted] truncate">via {filing.registrant}</p>
                      {filing.description && (
                        <p className="text-[10px] text-[--text-secondary] mt-1 line-clamp-2">{filing.description}</p>
                      )}
                    </div>
                    {(filing.income || filing.expenses) && (
                      <span className="text-[11px] font-semibold text-purple-600 shrink-0">
                        {fmt(filing.income || filing.expenses || 0)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[--border]">
              <a href={ldaVerifyUrl(billType, billNumber)}
                target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[--text-muted] hover:text-[--text] transition-colors flex items-center gap-1">
                Verify these filings on the Senate LDA database <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        ) : (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-[--text-muted] shrink-0" />
              <p className="text-xs text-[--text-muted]">No lobbying disclosures matched this bill.</p>
            </div>
            <a href={ldaVerifyUrl(billType, billNumber)}
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
