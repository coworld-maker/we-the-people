import prisma from '@/lib/prisma'
import { ExternalLink, DollarSign } from 'lucide-react'

export default async function LobbyingPanel({ bill }: { bill: any }) {
  const sponsors: any[] = Array.isArray(bill.sponsors) ? bill.sponsors : []
  if (sponsors.length === 0) return null

  const bioguideIds = sponsors.map((s: any) => s.bioguideId).filter(Boolean)

  const reps = bioguideIds.length > 0
    ? await prisma.representative.findMany({
        where: { bioguideId: { in: bioguideIds } },
        select: { bioguideId: true, fullName: true, party: true, state: true, chamber: true },
      })
    : []

  // Build display list: prefer DB-matched reps, fall back to sponsors JSON
  type Entry = { name: string; party: string; state: string; chamber: string; searchUrl: string; profileUrl: string }
  const entries: Entry[] = []
  const matched = new Set<string>()

  reps.forEach(rep => {
    matched.add(rep.bioguideId)
    entries.push({
      name: rep.fullName,
      party: rep.party,
      state: rep.state,
      chamber: rep.chamber,
      searchUrl: `https://www.opensecrets.org/search?q=${encodeURIComponent(rep.fullName)}&type=1`,
      profileUrl: `https://www.congress.gov/member/${rep.fullName.toLowerCase().replace(/\s+/g, '-')}/${rep.bioguideId}`,
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
      searchUrl: `https://www.opensecrets.org/search?q=${encodeURIComponent(name)}&type=1`,
      profileUrl: s.bioguideId ? `https://www.congress.gov/member/${name.toLowerCase().replace(/\s+/g, '-')}/${s.bioguideId}` : '',
    })
  })

  if (entries.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
        <div>
          <h3 className="font-display text-sm font-bold text-[--text]">Who's funding this?</h3>
          <p className="text-[11px] text-[--text-muted] mt-0.5">PAC & donor data for bill sponsors</p>
        </div>
      </div>

      <div className="divide-y divide-[--border]">
        {entries.map((entry, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${entry.party === 'R' ? 'bg-red-500' : entry.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'}`}>
              {entry.party[0]}
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
              Donors <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[--border]">
        <a href="https://www.opensecrets.org" target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-[--text-muted] hover:text-[--text] transition-colors flex items-center gap-1">
          Data via OpenSecrets / Center for Responsive Politics <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
