import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Rep {
  bioguideId: string
  fullName: string
  firstName: string
  lastName: string
  party: string
  chamber: string
  district?: string | null
}

interface Props {
  rep: Rep
}

function partyBg(party: string): string {
  if (party === 'R') return 'bg-red-500'
  if (party === 'D') return 'bg-blue-500'
  if (party === 'I') return 'bg-purple-500'
  return 'bg-slate-400'
}

function partyText(party: string): string {
  if (party === 'R') return 'text-red-700'
  if (party === 'D') return 'text-blue-700'
  if (party === 'I') return 'text-purple-700'
  return 'text-slate-600'
}

function partyLabel(party: string): string {
  if (party === 'R') return 'Republican'
  if (party === 'D') return 'Democrat'
  if (party === 'I') return 'Independent'
  return party
}

/**
 * Compact, scannable rep card for the state-page delegation sidebar.
 *
 * Visual hierarchy:
 *   - Party-colored left stripe → 0.5 sec recognition of party
 *   - Initials avatar in same color → secondary reinforcement
 *   - Full name in bold + role in muted text
 *   - Hover lifts the border to accent color
 */
export default function DelegationCard({ rep }: Props) {
  const role = rep.chamber === 'Senate'
    ? 'U.S. Senator'
    : rep.district
      ? `District ${rep.district} Representative`
      : 'Representative'

  return (
    <Link
      href={`/scorecards/${rep.bioguideId}`}
      className="group block"
    >
      <div className="flex items-stretch gap-2.5 rounded-lg border border-[--border] hover:border-[--accent] hover:shadow-sm transition-all bg-[--surface] overflow-hidden">
        {/* Party color stripe — full height left edge */}
        <div className={`w-1 ${partyBg(rep.party)} shrink-0`} aria-hidden="true" />

        {/* Body */}
        <div className="flex items-center gap-3 py-2.5 pr-2.5 flex-1 min-w-0">
          {/* Initials in party-colored circle */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${partyBg(rep.party)}`}
            aria-hidden="true"
          >
            {rep.firstName[0]}{rep.lastName[0]}
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[--text] truncate group-hover:text-[--accent] transition-colors">
              {rep.fullName}
            </p>
            <p className="text-[11px] text-[--text-muted] flex items-center gap-1.5 mt-0.5 truncate">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${partyText(rep.party)}`}>
                {partyLabel(rep.party)}
              </span>
              <span>·</span>
              <span className="truncate">{role}</span>
            </p>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  )
}
