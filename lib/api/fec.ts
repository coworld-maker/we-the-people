const FEC_BASE = 'https://api.open.fec.gov/v1'
const FEC_API_KEY = process.env.OPEN_FEC_API_KEY || 'DEMO_KEY'

export interface FECDonor {
  /**
   * The employer string an individual contributor self-reported to the FEC.
   * This is a GROUPING KEY, not a donor. The organization itself gave nothing:
   * corporations and unions may not contribute to federal candidates from their
   * treasuries at all.
   */
  employer: string
  /**
   * Sum of ITEMIZED CONTRIBUTIONS FROM INDIVIDUALS who named `employer`, to one
   * of the candidate's committees, over a whole election cycle. It is NOT money
   * given by that organization, and it has no connection to any particular bill.
   * Any UI showing this must say whose money it is — see
   * components/bills/LobbyingPanel Section A.
   */
  total: number
  /** Number of itemized contributions summed into `total`. */
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

export async function getTopDonorsByEmployer(
  committeeId: string,
  cycle = currentFECCycle()
): Promise<{ donors: FECDonor[]; cycle: string }> {
  // Try current cycle first, fall back to previous cycle.
  //
  // Returns the cycle the rows ACTUALLY came from, not the one requested. This
  // used to return the donor array alone, so a caller that fell back to the
  // previous cycle still labelled the figures with the current one — two-year-old
  // contributions captioned as this cycle's.
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
      return {
        donors: results.slice(0, 8).map(r => ({
          employer: r.employer,
          total: r.total,
          count: r.count,
        })),
        cycle: c,
      }
    }
  }
  return { donors: [], cycle }
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

  // Note: only the first principal committee is queried, so these are the top
  // employers behind one of the candidate's committees, not all of them.
  const { donors, cycle } = await getTopDonorsByEmployer(
    resolvedCommitteeIds[0],
    currentFECCycle()
  )
  if (donors.length === 0) return null

  // `cycle` is the cycle the rows came from, which may be the fallback rather
  // than the current one. Pass it through unchanged — the UI labels with it.
  return { donors, cycle }
}
