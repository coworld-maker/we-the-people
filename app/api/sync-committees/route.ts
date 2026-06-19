// Syncs committee assignments into the Representative table from the
// unitedstates/congress-legislators committee data (published via GitHub Pages).
// Triggered by cron or manually: POST /api/sync-committees with Bearer CRON_SECRET.

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkSyncAuth } from '@/lib/auth/syncAuth'

const MEMBERSHIP_URL = 'https://unitedstates.github.io/congress-legislators/committee-membership-current.json'
const COMMITTEES_URL = 'https://unitedstates.github.io/congress-legislators/committees-current.json'

interface CommitteeMeta { thomas_id: string; name: string; subcommittees?: { thomas_id: string; name: string }[] }
interface MembershipEntry { bioguide?: string }

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkSyncAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [mRes, cRes] = await Promise.all([
      fetch(MEMBERSHIP_URL, { next: { revalidate: 86400 } }),
      fetch(COMMITTEES_URL, { next: { revalidate: 86400 } }),
    ])
    if (!mRes.ok || !cRes.ok) {
      throw new Error(`Fetch failed: membership ${mRes.status}, committees ${cRes.status}`)
    }
    const membership: Record<string, MembershipEntry[]> = await mRes.json()
    const committees: CommitteeMeta[] = await cRes.json()

    // thomas_id → display name (parent committees only; subcommittees roll up
    // to their parent so a member shows e.g. "Judiciary" not 5 subcommittees).
    const idToName = new Map<string, string>()
    for (const c of committees) {
      idToName.set(c.thomas_id, c.name)
      for (const sub of c.subcommittees ?? []) {
        // Map subcommittee ids (parent id + suffix) back to the parent name
        idToName.set(c.thomas_id + sub.thomas_id, c.name)
      }
    }

    // bioguide → set of committee names
    const byBioguide = new Map<string, Set<string>>()
    for (const [committeeId, members] of Object.entries(membership)) {
      // Parent committees have 4-char thomas ids; subcommittees are longer.
      const parentId = committeeId.length > 4 ? committeeId.slice(0, 4) : committeeId
      const name = idToName.get(committeeId) || idToName.get(parentId)
      if (!name) continue
      for (const m of members) {
        if (!m.bioguide) continue
        if (!byBioguide.has(m.bioguide)) byBioguide.set(m.bioguide, new Set())
        byBioguide.get(m.bioguide)!.add(name)
      }
    }

    const reps = await prisma.representative.findMany({
      where: { currentTerm: true },
      select: { id: true, bioguideId: true },
    })

    let updated = 0
    for (const rep of reps) {
      const names = byBioguide.get(rep.bioguideId)
      if (!names || names.size === 0) continue
      await prisma.representative.update({
        where: { id: rep.id },
        data: { committees: Array.from(names).sort() },
      })
      updated++
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bioguidesWithCommittees: byBioguide.size,
      repsUpdated: updated,
    })
  } catch (e) {
    console.error('[sync-committees]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
