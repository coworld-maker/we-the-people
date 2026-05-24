'use client'

import { useMemo, useState } from 'react'

interface Slice {
  area: string
  count: number
}

interface Props {
  data: Slice[]
  /** Render top N areas; the rest are aggregated into 'Other' */
  topN?: number
}

/**
 * Color palette synced with /policy-areas grid + /bills grouped view.
 * Falls back through the palette in order for areas not explicitly mapped.
 */
const AREA_COLORS: Record<string, string> = {
  'Armed Forces and National Security':       '#B91C1C',
  'Commerce':                                 '#2563EB',
  'Crime and Law Enforcement':                '#475569',
  'Economics and Public Finance':             '#059669',
  'Education':                                '#7C3AED',
  'Energy':                                   '#D97706',
  'Environmental Protection':                 '#16A34A',
  'Finance and Financial Sector':             '#0891B2',
  'Foreign Trade and International Finance':  '#0284C7',
  'Government Operations and Politics':       '#4F46E5',
  'Health':                                   '#E11D48',
  'Housing and Community Development':        '#EA580C',
  'Immigration':                              '#0D9488',
  'International Affairs':                    '#06B6D4',
  'Labor and Employment':                     '#CA8A04',
  'Public Lands and Natural Resources':       '#65A30D',
  'Science, Technology, Communications':      '#9333EA',
  'Social Welfare':                           '#DB2777',
  'Taxation':                                 '#047857',
  'Transportation and Public Works':          '#1D4ED8',
  'Uncategorized':                            '#9CA3AF',
  'Other':                                    '#94A3B8',
}

const FALLBACK_PALETTE = [
  '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED',
  '#0891B2', '#DB2777', '#0D9488', '#CA8A04', '#4F46E5',
]

function colorFor(area: string, fallbackIndex: number): string {
  return AREA_COLORS[area] ?? FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length]
}

/**
 * Donut chart of bill counts by policy area. Pure SVG arc math; no charting
 * library needed. Hover a slice → shows that slice's name + count + share
 * in the donut hole.
 */
export default function PolicyAreaPieChart({ data, topN = 8 }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const slices = useMemo(() => {
    if (!data?.length) return []
    const sorted = [...data].sort((a, b) => b.count - a.count)
    const top = sorted.slice(0, topN)
    const restCount = sorted.slice(topN).reduce((s, x) => s + x.count, 0)
    const all = restCount > 0 ? [...top, { area: 'Other', count: restCount }] : top
    const total = all.reduce((s, x) => s + x.count, 0)
    return all.map((s, i) => ({
      ...s,
      share: total === 0 ? 0 : s.count / total,
      color: colorFor(s.area, i),
    }))
  }, [data, topN])

  const total = slices.reduce((s, x) => s + x.count, 0)
  if (total === 0) return null

  // ── SVG geometry ────────────────────────────────────────────────────────
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const outerR = 90
  const innerR = 56 // makes it a donut

  const arcs = useMemo(() => {
    let acc = 0
    return slices.map((s) => {
      const startAngle = acc * Math.PI * 2 - Math.PI / 2
      acc += s.share
      const endAngle = acc * Math.PI * 2 - Math.PI / 2
      const largeArc = s.share > 0.5 ? 1 : 0
      const x1 = cx + outerR * Math.cos(startAngle)
      const y1 = cy + outerR * Math.sin(startAngle)
      const x2 = cx + outerR * Math.cos(endAngle)
      const y2 = cy + outerR * Math.sin(endAngle)
      const x3 = cx + innerR * Math.cos(endAngle)
      const y3 = cy + innerR * Math.sin(endAngle)
      const x4 = cx + innerR * Math.cos(startAngle)
      const y4 = cy + innerR * Math.sin(startAngle)
      const d = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ')
      return { ...s, d }
    })
  }, [slices, cx, cy])

  const active = hovered ? slices.find(s => s.area === hovered) : null

  return (
    <div className="flex items-center gap-5 flex-wrap">
      {/* Donut */}
      <div className="shrink-0 relative">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-44 h-44">
          {arcs.map(({ area, d, color, share }) => (
            <path
              key={area}
              d={d}
              fill={color}
              opacity={active && active.area !== area ? 0.35 : 1}
              stroke="var(--surface)"
              strokeWidth={1}
              onMouseEnter={() => setHovered(area)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default', transition: 'opacity 120ms' }}
            >
              <title>{area}: {Math.round(share * 100)}%</title>
            </path>
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {active ? (
            <>
              <span className="text-xl font-bold text-[--text]">{Math.round(active.share * 100)}%</span>
              <span className="text-[10px] text-[--text-muted] max-w-[80px] text-center leading-tight mt-0.5">
                {active.area}
              </span>
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-[--text]">{total}</span>
              <span className="text-[10px] text-[--text-muted] uppercase tracking-wider">bills</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {slices.map(s => (
          <button
            key={s.area}
            onMouseEnter={() => setHovered(s.area)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center gap-2 text-left text-xs py-0.5 transition-opacity ${
              active && active.area !== s.area ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="font-medium text-[--text] truncate flex-1">{s.area}</span>
            <span className="text-[--text-muted] tabular-nums">{s.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
