const LDA_BASE = 'https://lda.senate.gov/api/v1'
const LDA_API_KEY = process.env.LDA_API_KEY

export interface LDAFiling {
  registrant: string
  client: string
  description: string
  income?: number
  expenses?: number
}

// The LDA filings endpoint only offers a free-text filter on issue descriptions
// (filing_specific_lobbying_issues). It SUBSTRING-matches, so "H.R. 1" also
// matches "H.R. 1000" — wildly over-counting. We therefore:
//   1. query with the canonical written form ("H.R. 4405", "S. 1863")
//   2. EXACT-match each returned filing's activity text with a bounded regex
//      so the bill number can't be a prefix of a longer one
// This turns an unreliable substring count into an accurate firm count.

const SEARCH_PREFIX: Record<string, string> = {
  HR: 'H.R.', S: 'S.', HRES: 'H.Res.', SRES: 'S.Res.',
  HJRES: 'H.J.Res.', SJRES: 'S.J.Res.', HCONRES: 'H.Con.Res.', SCONRES: 'S.Con.Res.',
}
// Token groups as written in filings (e.g. HJRES → "H.J.Res.")
const TYPE_PARTS: Record<string, string[]> = {
  HR: ['H', 'R'], S: ['S'], HRES: ['H', 'RES'], SRES: ['S', 'RES'],
  HJRES: ['H', 'J', 'RES'], SJRES: ['S', 'J', 'RES'],
  HCONRES: ['H', 'CON', 'RES'], SCONRES: ['S', 'CON', 'RES'],
}

function searchTerm(billType: string, billNumber: string): string {
  const t = billType.toUpperCase()
  return `${SEARCH_PREFIX[t] ?? t} ${billNumber}`
}

// Bill numbers RESTART every Congress, so "H.R. 6644" matches filings about a
// completely different bill from a previous Congress. Without this window, the
// 2025 housing bill H.R. 6644 showed 18 "lobbying firms" that were really
// filings about the Global Partnerships Act of 2012 and a 2020 health-insurance
// bill. Constrain every query to the Congress's own two years.
// Congress 119 → 2025-2026; 118 → 2023-2024; etc.
export function congressYears(congress: number | string): [number, number] {
  const n = Number(congress)
  const start = 2 * n + 1787
  return [start, start + 1]
}

/** Public LDA URL to verify the underlying filings for a bill. */
export function ldaVerifyUrl(billType: string, billNumber: string, congress?: number | string): string {
  const params = new URLSearchParams({
    filing_specific_lobbying_issues: searchTerm(billType, billNumber),
    ordering: '-filing_year',
  })
  // Link users to the same year-scoped view the panel counts from.
  if (congress) params.set('filing_year', String(congressYears(congress)[1]))
  return `${LDA_BASE}/filings/?${params.toString()}`
}

function exactRegex(billType: string, billNumber: string): RegExp {
  const parts = TYPE_PARTS[billType.toUpperCase()] ?? [billType.toUpperCase()]
  const body = parts.join('\\.?\\s*')
  // (?<![A-Za-z]) left boundary; (?!\d) so 4405 doesn't match 44050
  return new RegExp(`(?<![A-Za-z])${body}\\.?\\s*0*${billNumber}(?!\\d)`, 'i')
}

interface LDARawFiling {
  registrant?: { name?: string }
  client?: { name?: string }
  filing_year?: number
  lobbying_activities?: Array<{ description?: string }>
  income?: string | null
  expenses?: string | null
}

// One fetch shared by both public functions. Exact-matches the bill in the
// activity text and de-dupes by registrant+client.
async function fetchExactFilings(
  billType: string,
  billNumber: string,
  pageSize: number,
  congress?: number | string,
): Promise<LDAFiling[] | null> {
  if (!billType || !billNumber) return null
  const re = exactRegex(billType, billNumber)

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (LDA_API_KEY) headers['Authorization'] = `Token ${LDA_API_KEY}`

  // Query each year of the bill's Congress separately — the API's filing_year
  // filter is exact-match, and scoping server-side means page_size applies to
  // in-window filings only (not swamped by decades of same-number filings).
  const years = congress ? congressYears(congress) : []

  const fetchYear = async (year?: number): Promise<LDARawFiling[] | null> => {
    const url = new URL(`${LDA_BASE}/filings/`)
    url.searchParams.set('filing_specific_lobbying_issues', searchTerm(billType, billNumber))
    url.searchParams.set('ordering', '-filing_year')
    url.searchParams.set('page_size', String(pageSize))
    if (year) url.searchParams.set('filing_year', String(year))
    try {
      const res = await fetch(url.toString(), { headers, next: { revalidate: 86400 } })
      if (!res.ok) return null
      const data: { results?: LDARawFiling[] } = await res.json()
      return data.results ?? []
    } catch {
      return null
    }
  }

  try {
    // Parallel is correct here: throughput is governed by the caller's pacing
    // (sync-lobbying's DELAY_MS), not by ordering within a single bill, and
    // serializing these would add latency to every cold bill-page render.
    const pages = years.length
      ? await Promise.all(years.map(y => fetchYear(y)))
      : [await fetchYear()]

    // If ANY year failed we cannot know the true total, so report "unknown"
    // (null) rather than a partial count. A partial is indistinguishable from a
    // real drop once stored, and this number is shown to users as fact.
    if (pages.some(p => p === null)) return null
    const results = pages.flatMap(p => p ?? [])
    if (!results.length) return []

    const seen = new Set<string>()
    const filings: LDAFiling[] = []

    for (const r of results) {
      const acts = r.lobbying_activities ?? []
      const match = acts.find(a => a.description && re.test(a.description))
      if (!match) continue // substring-only collision (e.g. H.R. 1 vs H.R. 1000) — skip

      const registrant = r.registrant?.name || 'Unknown Firm'
      const client = r.client?.name || 'Unknown Client'
      const key = `${registrant}|${client}`
      if (seen.has(key)) continue
      seen.add(key)

      // Snippet centered on the actual bill mention — a single LDA filing often
      // lists many bills, so showing the start of the text would surface an
      // unrelated bill. Window around the match instead.
      const full = match.description || ''
      const idx = full.search(re)
      const start = Math.max(0, idx - 70)
      const end = Math.min(full.length, idx + 150)
      const description = `${start > 0 ? '…' : ''}${full.slice(start, end).trim()}${end < full.length ? '…' : ''}`

      filings.push({
        registrant,
        client,
        description,
        income: r.income ? parseFloat(r.income) : undefined,
        expenses: r.expenses ? parseFloat(r.expenses) : undefined,
      })
    }
    return filings
  } catch {
    return null
  }
}

/**
 * Distinct lobbying firm+client pairs that filed activity on this exact bill.
 * Pass `congress` — without it, filings from earlier Congresses that reused the
 * same bill number are counted too.
 */
export async function getLobbyingFirmCount(
  billType: string, billNumber: string, congress?: number | string,
): Promise<number | null> {
  const filings = await fetchExactFilings(billType, billNumber, 100, congress)
  // null = could not determine (fetch failed / rate-limited). Callers MUST NOT
  // persist this as 0 — doing so overwrote verified counts with zeros.
  return filings === null ? null : filings.length
}

/**
 * Filings for the bill, or null when the lookup failed. Callers must show
 * "couldn't load" for null rather than "no lobbying found" — collapsing the two
 * states tells users a bill has no lobbyists when we simply couldn't check.
 */
export async function getLobbyingForBill(
  billType: string, billNumber: string, congress?: number | string,
): Promise<LDAFiling[] | null> {
  const filings = await fetchExactFilings(billType, billNumber, 100, congress)
  return filings === null ? null : filings.slice(0, 10)
}
