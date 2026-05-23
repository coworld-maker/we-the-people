'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { MapPin, Sparkles, Loader2, Info } from 'lucide-react'

const FIPS_TO_STATE: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
}

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DC:'Washington D.C.',DE:'Delaware',
  FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',
  IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',
  ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',
  RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',
  TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

const WIDTH = 960
const HEIGHT = 600
const TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

interface ImpactScore {
  score: number
  reason: string
}

interface StateFeature extends Feature<Geometry, { name?: string }> {
  id: string
}

interface Props {
  billId: string
}

/**
 * Color interpolation: light gray (low impact) → orange → deep red (high impact)
 * Using approximate sRGB midpoints for a smooth ramp.
 */
function colorForScore(score: number): string {
  // 0.0 → #E2E8F0 (slate-200), 0.5 → #FB923C (orange-400), 1.0 → #B91C1C (red-700)
  if (score < 0.5) {
    const t = score / 0.5
    return interpolate('#E2E8F0', '#FB923C', t)
  }
  const t = (score - 0.5) / 0.5
  return interpolate('#FB923C', '#B91C1C', t)
}

function interpolate(a: string, b: string, t: number): string {
  const pa = parseHex(a)
  const pb = parseHex(b)
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t)
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t)
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export default function BillImpactMap({ billId }: Props) {
  const router = useRouter()
  const [features, setFeatures] = useState<StateFeature[] | null>(null)
  const [impacts, setImpacts] = useState<Record<string, ImpactScore> | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)

  // Load impacts + map data in parallel
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`/api/bills/${billId}/state-impact`).then(r => r.ok ? r.json() : null),
      fetch(TOPO_URL).then(r => r.ok ? r.json() : Promise.reject()),
    ])
      .then(([impactData, topo]) => {
        if (cancelled) return
        if (impactData?.stateImpacts) {
          setImpacts(impactData.stateImpacts)
          setGeneratedAt(impactData.generatedAt ?? null)
        }
        const geo = feature(topo, topo.objects.states) as unknown as FeatureCollection<Geometry, { name?: string }>
        setFeatures(geo.features as StateFeature[])
      })
      .catch(() => !cancelled && setError('Could not load map data'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [billId])

  // Auto-generate impacts on first view when none exist yet. The deterministic
  // mapper covers the 10 most common policy areas with zero AI cost, so most
  // bills resolve instantly. AI is only invoked for the long tail.
  const triggeredRef = useRef(false)
  useEffect(() => {
    if (loading || impacts || generating || triggeredRef.current) return
    triggeredRef.current = true
    handleGenerate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, impacts, generating])

  const paths = useMemo(() => {
    if (!features) return [] as Array<{ code: string; d: string }>
    const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features } as FeatureCollection)
    const pathGen = geoPath(projection)
    const out: Array<{ code: string; d: string }> = []
    for (const f of features) {
      const code = FIPS_TO_STATE[String(f.id).padStart(2, '0')]
      if (!code) continue
      const d = pathGen(f as any)
      if (d) out.push({ code, d })
    }
    return out
  }, [features])

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/state-impact`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate')
      setImpacts(json.stateImpacts)
      setGeneratedAt(json.generatedAt ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  // ── Top-N most-impacted states (for the side list) ─────────────────────────
  const topImpacted = useMemo(() => {
    if (!impacts) return []
    return Object.entries(impacts)
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [impacts])

  const activeImpact = hovered && impacts ? impacts[hovered] : null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <MapPin className="w-4 h-4 text-orange-500" />
        <h3 className="font-display text-sm font-bold text-[--text] flex-1">Impact by state</h3>
        {impacts && (
          <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-[10px]">
            AI estimate
          </span>
        )}
      </div>

      <div className="p-4">
        {loading || generating ? (
          /* Initial load OR auto-generating impact data */
          <div className="py-10 flex flex-col items-center justify-center text-center px-4">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
            <p className="text-xs font-semibold text-[--text] mb-0.5">
              {generating ? 'Analyzing impact by state…' : 'Loading map…'}
            </p>
            {generating && (
              <p className="text-[10px] text-[--text-muted] max-w-xs">
                Mapping which states this bill affects most.
              </p>
            )}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
            <button onClick={handleGenerate} className="btn-secondary text-xs px-3 py-1.5">
              <Sparkles className="w-3 h-3" /> Try again
            </button>
          </div>
        ) : !impacts ? (
          /* Fallback — auto-trigger hasn't fired yet (effect race) */
          <div className="text-center py-6">
            <Sparkles className="w-6 h-6 text-orange-500 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold text-[--text] mb-1">Preparing impact analysis</p>
            <p className="text-xs text-[--text-muted] mb-4 max-w-xs mx-auto">
              Per-state impact estimate — usually free for common policy areas, AI-generated for the rest.
            </p>
            <button
              onClick={handleGenerate}
              className="btn-primary text-xs px-4 py-2"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Generate analysis
              </span>
            </button>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-auto"
              style={{ maxHeight: 320 }}
              aria-label="Per-state impact heatmap"
            >
              {paths.map(({ code, d }) => {
                const impact = impacts[code]
                const fill = impact ? colorForScore(impact.score) : 'var(--surface-tertiary)'
                const isHovered = hovered === code
                return (
                  <path
                    key={code}
                    d={d}
                    fill={fill}
                    stroke="var(--surface)"
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    onMouseEnter={() => setHovered(code)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => router.push(`/states/${code}`)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 100ms' }}
                  >
                    <title>
                      {STATE_NAMES[code]}: {impact ? `${Math.round(impact.score * 100)}% impact — ${impact.reason}` : 'No data'}
                    </title>
                  </path>
                )
              })}
            </svg>

            {/* Hovered breakdown */}
            <div className="min-h-[36px] mt-1 text-center px-2">
              {activeImpact ? (
                <p className="text-xs">
                  <span className="font-bold text-[--text]">{STATE_NAMES[hovered!]}</span>
                  <span className="text-[--text-muted]"> · </span>
                  <span className="text-orange-600 font-semibold">{Math.round(activeImpact.score * 100)}% impact</span>
                  <span className="text-[--text-muted] block mt-0.5 leading-tight">{activeImpact.reason}</span>
                </p>
              ) : (
                <p className="text-[11px] text-[--text-muted] flex items-center justify-center gap-1">
                  <Info className="w-3 h-3" /> Hover a state to see why it's affected
                </p>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-[--text-muted]">
              <span>Low</span>
              <div className="flex h-2 w-32 rounded overflow-hidden" style={{ background: 'linear-gradient(to right, #E2E8F0, #FB923C, #B91C1C)' }} />
              <span>High</span>
            </div>

            {/* Top-impacted list */}
            {topImpacted.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[--border]">
                <p className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider mb-2">Top impacted</p>
                <div className="space-y-1.5">
                  {topImpacted.map(s => (
                    <button
                      key={s.code}
                      onClick={() => router.push(`/states/${s.code}`)}
                      className="w-full flex items-center gap-2 text-left hover:bg-[--surface-secondary] rounded px-1.5 py-1 transition-colors"
                    >
                      <span className="text-xs font-bold text-[--text] w-7">{s.code}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[--surface-tertiary] overflow-hidden">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${Math.round(s.score * 100)}%`, background: colorForScore(s.score) }}
                        />
                      </div>
                      <span className="text-[10px] text-[--text-muted] w-8 text-right">{Math.round(s.score * 100)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {generatedAt && (
              <p className="text-[10px] text-[--text-muted] text-center mt-3">
                Analysis generated {new Date(generatedAt).toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
