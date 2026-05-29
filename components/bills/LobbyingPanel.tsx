import prisma from '@/lib/prisma'
import Link from 'next/link'
import { DollarSign, ExternalLink, Info } from 'lucide-react'
import { OpenSecretsAPI } from '@/lib/api/opensecrets'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default async function LobbyingPanel({ bill }: { bill: any }) {
  const sponsors: any[] = Array.isArray(bill.sponsors) ? bill.sponsors : []
  if (sponsors.length === 0) return null

  const bioguideIds = sponsors.map((s: any) => s.bioguideId).filter(Boolean)
  const hasApiKey = !!process.env.OPENSECRETS_API_KEY

  type RepWithFunding = {
    name: string; party: string; state: string; chamber: string
    searchUrl: string
    contributors: Array<{ org: string; total: number }>
  }

  const repData: RepWithFunding[] = []

  if (bioguideIds.length > 0) {
    const reps = await prisma.representative.findMany({
      where: { bioguideId: { in: bioguideIds } },
    })

    if (hasApiKey) {
      // Group by state to minimise OpenSecrets API calls
      const byState = new Map<string, typeof reps>()
      reps.forEach(r => {
        const arr = byState.get(r.state) || []
        arr.push(r)
        byState.set(r.state, arr)
      })

      for (const [state, stateReps] of byState) {
        const legislators = await OpenSecretsAPI.getLegislators(state)
        for (const rep of stateReps) {
          const match = legislators.find(l => l.bioguide_id === rep.bioguideId)
          if (!match?.cid) {
            repData.push({
              name: rep.fullName, party: rep.party, state: rep.state, chamber: rep.chamber,
              searchUrl: `https://www.opensecrets.org/search?q=${encodeURIComponent(rep.fullName)}&type=1`,
              contributors: [],
            })
            continue
          }
          const contribs = await OpenSecretsAPI.getTopContributors(match.cid)
          repData.push({
            name: rep.fullName, party: rep.party, state: rep.state, chamber: rep.chamber,
            searchUrl: `https://www.opensecrets.org/members-of-congress/summary?cid=${match.cid}`,
            contributors: contribs.slice(0, 5),
          })
        }
      }
    } else {
      reps.forEach(rep => repData.push({
        name: rep.fullName, party: rep.party, state: rep.state, chamber: rep.chamber,
        searchUrl: `https://www.opensecrets.org/search?q=${encodeURIComponent(rep.fullName)}&type=1`,
        contributors: [],
      }))
    }
  }

  // Fallback: sponsors not in Representative table — show name + link
  const fallbackSponsors = sponsors.filter(
    (s: any) => s.bioguideId && !repData.find(r => r.name === (s.fullName || `${s.firstName} ${s.lastName}`))
  )
  fallbackSponsors.forEach((s: any) => {
    const name = s.fullName || `${s.firstName} ${s.lastName}`
    repData.push({
      name, party: s.party ?? '?', state: s.state ?? '', chamber: '',
      searchUrl: `https://www.opensecrets.org/search?q=${encodeURIComponent(name)}&type=1`,
      contributors: [],
    })
  })

  if (repData.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="flex-1">
          <h3 className="font-display text-sm font-bold text-[--text]">Who's funding this?</h3>
          <p className="text-[11px] text-[--text-muted] mt-0.5">PAC & donor data for bill sponsors</p>
        </div>
        {!hasApiKey && (
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-full font-medium shrink-0">
            No API key
          </span>
        )}
      </div>

      <div className="divide-y divide-[--border]">
        {repData.map((rep, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${rep.party === 'R' ? 'bg-red-500' : rep.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                {rep.party[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[--text] truncate">{rep.name}</p>
                <p className="text-[10px] text-[--text-muted]">
                  {rep.chamber === 'senate' ? 'Senator' : rep.chamber === 'house' ? 'Rep.' : ''} {rep.state && `· ${rep.state}`}
                </p>
              </div>
              <a href={rep.searchUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-[--accent] hover:text-[--accent-hover] font-semibold shrink-0">
                OpenSecrets <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {rep.contributors.length > 0 ? (
              <div className="space-y-1.5">
                {rep.contributors.map((c, j) => (
                  <div key={j} className="flex justify-between items-center text-xs">
                    <span className="text-[--text-secondary] truncate mr-2">{c.org}</span>
                    <span className="font-semibold text-[--text] shrink-0">{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            ) : !hasApiKey ? (
              <p className="text-[11px] text-[--text-muted] flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                Add <code className="bg-[--surface-secondary] px-1 rounded">OPENSECRETS_API_KEY</code> for live data
              </p>
            ) : (
              <p className="text-[11px] text-[--text-muted]">Funding data not available</p>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[--border]">
        <a href="https://www.opensecrets.org" target="_blank" rel="noopener noreferrer"
          className="text-xs text-[--text-muted] hover:text-[--text] transition-colors flex items-center gap-1">
          Data source: OpenSecrets / Center for Responsive Politics
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
