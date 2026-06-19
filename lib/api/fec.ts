const FEC_BASE = 'https://api.open.fec.gov/v1'
const FEC_API_KEY = process.env.OPEN_FEC_API_KEY || 'DEMO_KEY'

export interface FECDonor {
  employer: string
  total: number
  count: number
}

export interface FECCommittee {
  committeeId: string
  name: string
  cycle: number
}

async function fecFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${FEC_BASE}${path}`)
  url.searchParams.set('api_key', FEC_API_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 }, // 24h cache
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// FEC election cycles end in even years. Compute the current cycle dynamically.
function currentFECCycle(): string {
  const year = new Date().getFullYear()
  return String(year % 2 === 0 ? year : year + 1)
}

export async function getFECCommittees(fecCandidateId: string): Promise<FECCommittee[]> {
  const data = await fecFetch<{ results: Array<{ committee_id: string; name: string; cycles: number[] }> }>(
    `/candidate/${fecCandidateId}/committees/`,
    { per_page: '10', designation: 'P' } // principal committees
  )
  if (!data?.results) return []

  return data.results.map(r => ({
    committeeId: r.committee_id,
    name: r.name,
    // Guard against an empty cycles array: [] is truthy, so `|| fallback`
    // would not fire and Math.max(...[]) returns -Infinity.
    cycle: Math.max(
      ...(r.cycles?.length ? r.cycles : [Number(currentFECCycle())])
    ),
  }))
}

// FEC "employer" buckets that carry no funder signal (occupation status, not an
// organization). Without filtering these, "RETIRED" and "SELF-EMPLOYED" dominate
// every candidate's top-employer list and the panel looks meaningless.
const NON_EMPLOYER_BUCKETS = new Set([
  'NONE', 'NULL', 'N/A', 'NA', 'NOT EMPLOYED', 'UNEMPLOYED', 'RETIRED',
  'SELF-EMPLOYED', 'SELF EMPLOYED', 'SELF', 'HOMEMAKER', 'INFORMATION REQUESTED',
  'REQUESTED', 'BEST EFFORTS', 'DECLINED', 'REFUSED', 'NOT PROVIDED',
])

function isMeaningfulEmployer(employer: string | null | undefined): boolean {
  if (!employer) return false
  return !NON_EMPLOYER_BUCKETS.has(employer.trim().toUpperCase())
}

export async function getTopDonorsByEmployer(committeeId: string, cycle = currentFECCycle()): Promise<FECDonor[]> {
  // Try current cycle first, fall back to previous cycle
  for (const c of [cycle, String(Number(cycle) - 2)]) {
    const data = await fecFetch<{
      results: Array<{ employer: string; total: number; count: number }>
    }>('/schedules/schedule_a/by_employer/', {
      committee_id: committeeId,
      cycle: c,
      // Pull extra rows so we still have 8 real employers after dropping the
      // occupation-status buckets (RETIRED/SELF-EMPLOYED, etc.).
      per_page: '30',
      sort: '-total',
    })

    const results = data?.results?.filter(r => isMeaningfulEmployer(r.employer)) ?? []
    if (results.length > 0) {
      return results.slice(0, 8).map(r => ({
        employer: r.employer,
        total: r.total,
        count: r.count,
      }))
    }
  }
  return []
}

export async function getTopDonorsForCandidate(
  fecIds: string[],
  committeeIds: string[]
): Promise<{ donors: FECDonor[]; cycle: string } | null> {
  if (!process.env.OPEN_FEC_API_KEY) return null

  // Prefer pre-fetched committeeIds; else resolve from fecIds
  let resolvedCommitteeIds = [...committeeIds]

  if (resolvedCommitteeIds.length === 0 && fecIds.length > 0) {
    for (const fecId of fecIds.slice(0, 2)) {
      const committees = await getFECCommittees(fecId)
      resolvedCommitteeIds.push(...committees.map(c => c.committeeId))
    }
  }

  if (resolvedCommitteeIds.length === 0) return null

  const cycle = currentFECCycle()
  const donors = await getTopDonorsByEmployer(resolvedCommitteeIds[0], cycle)
  if (donors.length === 0) return null

  return { donors, cycle }
}
