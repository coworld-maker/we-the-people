'use client'

import CollapsibleCard from '@/components/ui/CollapsibleCard'

interface PolicyData {
  area: string
  userPct: number
  repData: Array<{ name: string; pct: number; party: string }>
}

interface Props {
  data: PolicyData[]
  reps: Array<{ name: string; party: string }>
}

export default function VotingPatterns({ data, reps }: Props) {
  if (data.length === 0) {
    return (
      <CollapsibleCard storageKey="voting-patterns" title="Your Voting Patterns">
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-[--text-muted]">Vote on bills across different policy areas to see patterns.</p>
        </div>
      </CollapsibleCard>
    )
  }

  const maxBars = data.length
  const barGroupWidth = 100 / maxBars
  const numSeries = 1 + reps.length // user + reps
  const barWidth = Math.min(barGroupWidth * 0.7 / numSeries, 12)
  const svgWidth = 600
  const svgHeight = 280
  const chartLeft = 45
  const chartBottom = 50
  const chartTop = 20
  const chartRight = 20
  const chartW = svgWidth - chartLeft - chartRight
  const chartH = svgHeight - chartTop - chartBottom

  const yTicks = [0, 20, 40, 60, 80, 100]

  return (
    <CollapsibleCard storageKey="voting-patterns" title="Your Voting Patterns">
      <div className="p-5">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-600" />
            <span className="text-xs text-[--text-secondary]">Your Votes</span>
          </div>
          {reps.map((rep, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{
                backgroundColor: rep.party === 'D' ? '#3B82F6' : '#EF4444',
                opacity: 0.6 + (i * 0.2),
              }} />
              <span className="text-xs text-[--text-secondary]">{rep.name}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {yTicks.map(tick => {
            const y = chartTop + chartH - (tick / 100) * chartH
            return (
              <g key={tick}>
                <line x1={chartLeft} y1={y} x2={svgWidth - chartRight} y2={y}
                  stroke="var(--border)" strokeWidth={0.5} />
                <text x={chartLeft - 8} y={y + 4} textAnchor="end"
                  className="text-[10px]" fill="var(--text-muted)">{tick}%</text>
              </g>
            )
          })}

          {/* Bars */}
          {data.map((group, gi) => {
            const groupX = chartLeft + (gi / data.length) * chartW
            const groupW = chartW / data.length
            const totalBars = numSeries
            const bw = Math.min(groupW * 0.6 / totalBars, 24)
            const gap = 2
            const totalBarWidth = totalBars * bw + (totalBars - 1) * gap
            const startX = groupX + (groupW - totalBarWidth) / 2

            return (
              <g key={group.area}>
                {/* User bar */}
                <rect
                  x={startX}
                  y={chartTop + chartH - (group.userPct / 100) * chartH}
                  width={bw}
                  height={(group.userPct / 100) * chartH}
                  fill="#2563EB"
                  rx={2}
                />

                {/* Rep bars */}
                {group.repData.map((rep, ri) => {
                  const x = startX + (ri + 1) * (bw + gap)
                  const barH = (rep.pct / 100) * chartH
                  return (
                    <rect key={ri}
                      x={x}
                      y={chartTop + chartH - barH}
                      width={bw}
                      height={barH}
                      fill={rep.party === 'D' ? '#3B82F6' : '#EF4444'}
                      opacity={0.6 + (ri * 0.15)}
                      rx={2}
                    />
                  )
                })}

                {/* Category label */}
                <text
                  x={groupX + groupW / 2}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="text-[11px]"
                  fill="var(--text-secondary)"
                >
                  {group.area.length > 12 ? group.area.slice(0, 12) + '…' : group.area}
                </text>
              </g>
            )
          })}

          {/* Bottom axis */}
          <line x1={chartLeft} y1={chartTop + chartH} x2={svgWidth - chartRight} y2={chartTop + chartH}
            stroke="var(--border)" strokeWidth={1} />
        </svg>
      </div>
    </CollapsibleCard>
  )
}
