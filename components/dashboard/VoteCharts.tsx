'use client'

interface Props {
  stats: { totalVotes: number; yesVotes: number; noVotes: number; abstainVotes: number; policyAreas: number; favoritePolicy: string | null }
  votesByPolicy: Array<{ policy: string; count: number }>
}

function DonutChart({ yes, no, abstain, total }: { yes: number; no: number; abstain: number; total: number }) {
  if (total === 0) return <p className="text-sm text-[--text-muted] text-center py-8">No votes yet</p>

  const size = 140; const cx = 70; const cy = 70; const r = 52; const sw = 16
  const circ = 2 * Math.PI * r

  const segments = [
    { value: yes, color: '#22C55E', label: 'Yes' },
    { value: no, color: '#E5484D', label: 'No' },
    { value: abstain, color: '#8A8F98', label: 'Abstain' },
  ].filter(s => s.value > 0)

  let cumulative = 0
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-tertiary)" strokeWidth={sw} />
          {segments.map((seg, i) => {
            const pct = seg.value / total
            const dashLength = pct * circ
            const dashOffset = -cumulative * circ
            cumulative += pct
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={sw}
              strokeDasharray={`${dashLength} ${circ - dashLength}`} strokeDashoffset={dashOffset}
              style={{ transition: 'all 0.8s ease-out', transitionDelay: `${i * 150}ms` }} />
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-extrabold text-[--text]">{total}</span>
          <span className="text-[10px] text-[--text-muted]">votes</span>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Yes', v: yes, color: '#22C55E' },
          { label: 'No', v: no, color: '#E5484D' },
          { label: 'Abstain', v: abstain, color: '#8A8F98' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-[--text] font-medium w-16">{item.label}</span>
            <span className="text-sm font-bold text-[--text] w-10 text-right">{total > 0 ? Math.round((item.v / total) * 100) : 0}%</span>
            <span className="text-xs text-[--text-muted]">({item.v})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PolicyBars({ data }: { data: Array<{ policy: string; count: number }> }) {
  if (data.length === 0) return <p className="text-sm text-[--text-muted] text-center py-8">Vote on bills to see policy breakdown</p>
  const max = Math.max(...data.map(d => d.count))

  return (
    <div className="space-y-3">
      {data.slice(0, 6).map((item, i) => (
        <div key={item.policy}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[--text] font-medium truncate max-w-[65%]">{item.policy}</span>
            <span className="text-sm font-semibold text-[--accent]">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-[--surface-tertiary] overflow-hidden">
            <div className="h-2 rounded-full bg-[--accent] transition-all duration-800"
              style={{ width: `${(item.count / max) * 100}%`, opacity: 1 - i * 0.12, transitionDelay: `${i * 80}ms` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function VoteCharts({ stats, votesByPolicy }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="font-display text-sm font-bold text-[--text] mb-5">Vote distribution</h3>
        <DonutChart yes={stats.yesVotes} no={stats.noVotes} abstain={stats.abstainVotes} total={stats.totalVotes} />
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-sm font-bold text-[--text]">Policy areas</h3>
          <span className="badge bg-[--accent-light] text-[--accent]">{stats.policyAreas} explored</span>
        </div>
        <PolicyBars data={votesByPolicy} />
      </div>
    </div>
  )
}
