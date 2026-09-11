import prisma from '@/lib/prisma'
import Link from 'next/link'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import RepAvatar from '@/components/ui/RepAvatar'
import { ON_THE_BILL, agrees, latestPerMemberBill, normalizeMemberPosition } from '@/lib/data/voteKinds'

// Keys are the normalised positions. The stored values are lowercase
// ('yea', 'not_voting'); the old 'Yea'/'Nay' keys never matched, so every
// row fell through to the raw value and "Agrees with you" never showed.
const POSITION_MAP: Record<string, { label: string; cls: string }> = {
  yea:        { label: 'Voted YES',  cls: 'text-emerald-600' },
  nay:        { label: 'Voted NO',   cls: 'text-red-600' },
  not_voting: { label: 'Not voting', cls: 'text-[--text-muted]' },
  present:    { label: 'Present',    cls: 'text-amber-600' },
}

export default async function RepVotesOnBill({
  billId,
  userState,
  userVotePosition,
}: {
  billId: string
  userState: string | null
  userVotePosition: string | null
}) {
  if (!userState) return null

  const [reps, congressVotes] = await Promise.all([
    prisma.representative.findMany({
      where: { state: userState, currentTerm: true },
      orderBy: [{ chamber: 'asc' }, { lastName: 'asc' }],
    }),
    // Votes on the bill itself only; a procedural vote is not "how they voted" on it.
    prisma.congressVote.findMany({ where: { billId, ...ON_THE_BILL } }),
  ])

  if (reps.length === 0) return null

  const voteByBioguide = new Map(latestPerMemberBill(congressVotes).map(v => [v.bioguideId, v]))
  const rows = reps
    .map(rep => ({ rep, cv: voteByBioguide.get(rep.bioguideId) }))
    .filter(({ cv }) => cv !== undefined)

  if (rows.length === 0) return null

  const userYes = userVotePosition === 'yes'
  const userNo  = userVotePosition === 'no'

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border]">
        <h3 className="font-display text-sm font-bold text-[--text]">
          How your representatives voted
        </h3>
        <p className="text-[11px] text-[--text-muted] mt-0.5">{userState} delegation</p>
      </div>

      <div className="divide-y divide-[--border]">
        {rows.map(({ rep, cv }) => {
          const pos     = normalizeMemberPosition(cv!.position) ?? cv!.position
          const posInfo = POSITION_MAP[pos] ?? { label: pos, cls: 'text-[--text-muted]' }

          const hasVote    = userYes || userNo
          const same       = agrees(userVotePosition, cv!.position)
          const isMatch    = same === true
          const isMismatch = same === false

          return (
            <div key={rep.bioguideId} className="px-5 py-3 flex items-center gap-3">
              <RepAvatar bioguideId={rep.bioguideId} fullName={rep.fullName} party={rep.party} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[--text] leading-tight truncate">{rep.fullName}</p>
                <p className="text-[10px] text-[--text-muted]">
                  {/* Representative.chamber is stored capitalized ("Senate"); compare
                      case-insensitively or every senator is mislabeled "Rep." */}
                  {rep.chamber?.toLowerCase() === 'senate' ? 'Senator' : 'Rep.'} ({rep.party})
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-bold ${posInfo.cls}`}>{posInfo.label}</p>
                {cv!.question && (
                  <p className="text-[10px] text-[--text-muted]">{cv!.question}</p>
                )}
                {isMatch && (
                  <p className="text-[10px] font-medium text-emerald-600 flex items-center justify-end gap-0.5 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Agrees with you
                  </p>
                )}
                {isMismatch && (
                  <p className="text-[10px] font-medium text-red-500 flex items-center justify-end gap-0.5 mt-0.5">
                    <XCircle className="w-3 h-3" /> Disagrees
                  </p>
                )}
                {hasVote && !isMatch && !isMismatch && pos === 'not_voting' && (
                  <p className="text-[10px] text-[--text-muted] flex items-center justify-end gap-0.5 mt-0.5">
                    <MinusCircle className="w-3 h-3" /> Didn't vote
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3 border-t border-[--border]">
        <Link
          href="/my-representatives"
          className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors"
        >
          Full alignment scorecard →
        </Link>
      </div>
    </div>
  )
}
