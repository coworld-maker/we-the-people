const LDA_BASE = 'https://lda.senate.gov/api/v1'
const LDA_API_KEY = process.env.LDA_API_KEY

export interface LDAFiling {
  registrant: string
  client: string
  description: string
  income?: number
  expenses?: number
}

function normalizeBillNumber(billType: string, billNumber: string): string {
  // Normalize to LDA format: "HR1234", "S1234", "SRES123", etc.
  // Remove spaces and sanitize to alphanumeric only
  const type = billType.replace(/\s+/g, '').toUpperCase()
  const num = billNumber.replace(/\s+/g, '').replace(/[^A-Z0-9]/gi, '')
  return `${type}${num}`.replace(/[^A-Z0-9]/g, '')
}

interface LDARawFiling {
  registrant?: { name?: string }
  client?: { name?: string }
  lobbying_activities?: Array<{ description?: string }>
  income?: string | null
  expenses?: string | null
}

// Single fetch shared by both public functions. Returns the LD-2 filings for a
// bill, de-duplicated by registrant+client so a firm that files multiple
// disclosures for the same bill is counted once.
async function fetchDedupedFilings(
  billType: string,
  billNumber: string,
  pageSize: number,
): Promise<LDAFiling[] | null> {
  const normalized = normalizeBillNumber(billType, billNumber)
  if (!normalized) return null

  const url = new URL(`${LDA_BASE}/filings/`)
  url.searchParams.set('filing_type', 'LD2')
  url.searchParams.set('issue_bill_number', normalized)
  url.searchParams.set('page_size', String(pageSize))

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (LDA_API_KEY) headers['Authorization'] = `Token ${LDA_API_KEY}`

  try {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 86400 }, // 24h cache
    })
    if (!res.ok) return null

    const data: { results?: LDARawFiling[] } = await res.json()
    if (!data.results?.length) return []

    const seen = new Set<string>()
    const filings: LDAFiling[] = []

    for (const r of data.results) {
      const registrant = r.registrant?.name || 'Unknown Firm'
      const client = r.client?.name || 'Unknown Client'
      const key = `${registrant}|${client}`
      if (seen.has(key)) continue
      seen.add(key)

      const description = r.lobbying_activities?.[0]?.description?.slice(0, 200) || ''
      const income = r.income ? parseFloat(r.income) : undefined
      const expenses = r.expenses ? parseFloat(r.expenses) : undefined

      filings.push({ registrant, client, description, income, expenses })
    }

    return filings
  } catch {
    return null
  }
}

// Count of distinct lobbying firm+client pairs for a bill. Fetches a wide page
// and de-dupes, so this reflects unique firms — not the raw filing count, which
// over-reports when one firm files several LD-2s for the same bill.
export async function getLobbyingFirmCount(billType: string, billNumber: string): Promise<number> {
  const filings = await fetchDedupedFilings(billType, billNumber, 100)
  return filings?.length ?? 0
}

export async function getLobbyingForBill(billType: string, billNumber: string): Promise<LDAFiling[]> {
  const filings = await fetchDedupedFilings(billType, billNumber, 20)
  return (filings ?? []).slice(0, 10)
}
