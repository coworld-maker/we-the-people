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

/** Public LDA URL to verify the underlying filings for a bill. */
export function ldaVerifyUrl(billType: string, billNumber: string): string {
  return `${LDA_BASE}/filings/?filing_specific_lobbying_issues=${encodeURIComponent(searchTerm(billType, billNumber))}&ordering=-filing_year`
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
): Promise<LDAFiling[] | null> {
  if (!billType || !billNumber) return null
  const re = exactRegex(billType, billNumber)

  const url = new URL(`${LDA_BASE}/filings/`)
  url.searchParams.set('filing_specific_lobbying_issues', searchTerm(billType, billNumber))
  url.searchParams.set('ordering', '-filing_year') // bias toward the current Congress
  url.searchParams.set('page_size', String(pageSize))

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (LDA_API_KEY) headers['Authorization'] = `Token ${LDA_API_KEY}`

  try {
    const res = await fetch(url.toString(), { headers, next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data: { results?: LDARawFiling[] } = await res.json()
    if (!data.results?.length) return []

    const seen = new Set<string>()
    const filings: LDAFiling[] = []

    for (const r of data.results) {
      const acts = r.lobbying_activities ?? []
      const match = acts.find(a => a.description && re.test(a.description))
      if (!match) continue // substring-only collision (e.g. H.R. 1 vs H.R. 1000) — skip

      const registrant = r.registrant?.name || 'Unknown Firm'
      const client = r.client?.name || 'Unknown Client'
      const key = `${registrant}|${client}`
      if (seen.has(key)) continue
      seen.add(key)

      filings.push({
        registrant,
        client,
        description: (match.description || '').slice(0, 200),
        income: r.income ? parseFloat(r.income) : undefined,
        expenses: r.expenses ? parseFloat(r.expenses) : undefined,
      })
    }
    return filings
  } catch {
    return null
  }
}

/** Distinct lobbying firm+client pairs that filed activity on this exact bill. */
export async function getLobbyingFirmCount(billType: string, billNumber: string): Promise<number> {
  const filings = await fetchExactFilings(billType, billNumber, 100)
  return filings?.length ?? 0
}

export async function getLobbyingForBill(billType: string, billNumber: string): Promise<LDAFiling[]> {
  const filings = await fetchExactFilings(billType, billNumber, 100)
  return (filings ?? []).slice(0, 10)
}
