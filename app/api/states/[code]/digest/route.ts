import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AIService } from '@/lib/services/aiService'
import { abbrToName } from '@/lib/utils/state-codes'

const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
])

/**
 * AI-generated digest of what citizens in this state are paying attention to.
 *
 * Caching strategy: this is an expensive call (~1.5 KB output, Haiku) but the
 * underlying data only meaningfully changes day-to-day. So we cache per-state
 * in-memory at the module level with a 24-hour TTL. On Vercel each lambda
 * instance maintains its own cache — not perfect cross-instance sharing, but
 * good enough to keep AI cost under a few cents/day per state even at scale.
 */

interface CacheEntry {
  summary: string
  generatedAt: string
}
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code: raw } = await params
  const code = raw.toUpperCase()
  if (!VALID_STATES.has(code)) {
    return NextResponse.json({ error: 'Invalid state code' }, { status: 400 })
  }

  // Cache hit?
  const cached = cache.get(code)
  if (cached && Date.now() - new Date(cached.generatedAt).getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached, cached: true })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI digest unavailable (ANTHROPIC_API_KEY not configured)' },
      { status: 503 },
    )
  }

  // Gather inputs the AI digest needs
  const stateName = abbrToName(code) ?? code

  const [topPolicyAreaRaw, topBillsRaw, recentRepVotes] = await Promise.all([
    // Top policy areas by citizen-vote count
    prisma.vote.findMany({
      where: { user: { state: code } },
      select: { bill: { select: { policyArea: true } } },
      take: 500,
    }),
    // Top 5 bills by citizen-vote count in this state
    prisma.vote.groupBy({
      by: ['billId'],
      where: { user: { state: code } },
      _count: { billId: true },
      orderBy: { _count: { billId: 'desc' } },
      take: 5,
    }),
    // Recent rep activity — just the count + a sample for the prompt
    prisma.congressVote.findMany({
      where: { representative: { state: stateName } },
      orderBy: { votedAt: 'desc' },
      take: 10,
      select: {
        position: true,
        representative: { select: { fullName: true, party: true } },
        bill: { select: { billType: true, billNumber: true } },
      },
    }),
  ])

  // Aggregate top policy areas
  const counts: Record<string, number> = {}
  for (const v of topPolicyAreaRaw) {
    const area = v.bill?.policyArea
    if (area) counts[area] = (counts[area] || 0) + 1
  }
  const topPolicyAreas = Object.entries(counts)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Hydrate top bills
  const topBills = topBillsRaw.length === 0 ? [] : await prisma.bill.findMany({
    where: { id: { in: topBillsRaw.map(b => b.billId) } },
    select: { title: true, shortTitle: true, status: true, policyArea: true },
  })

  // Format rep activity into a short prompt line
  const repActivitySummary = recentRepVotes.length === 0
    ? ''
    : recentRepVotes.slice(0, 5).map(v =>
        `${v.representative.fullName} (${v.representative.party}) voted ${v.position} on ${v.bill.billType} ${v.bill.billNumber}`,
      ).join('; ')

  // If there's truly nothing to write about, return a static no-data message
  if (topBills.length === 0 && topPolicyAreas.length === 0 && recentRepVotes.length === 0) {
    return NextResponse.json({
      summary: `No citizen activity recorded yet in ${stateName}. Once people in the state vote on bills and discussions get going, a digest of trends will appear here.`,
      generatedAt: new Date().toISOString(),
      empty: true,
    })
  }

  // Call Claude
  try {
    const summary = await AIService.generateStateDigest({
      stateCode: code,
      stateName,
      topPolicyAreas,
      topBills,
      repActivitySummary,
    })
    const result = { summary: summary.trim(), generatedAt: new Date().toISOString() }
    cache.set(code, result)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('State digest generation failed:', e)
    return NextResponse.json({ error: e.message || 'Failed to generate digest' }, { status: 500 })
  }
}
