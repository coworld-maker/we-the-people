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

export async function getLobbyingForBill(billType: string, billNumber: string): Promise<LDAFiling[]> {
  const normalized = normalizeBillNumber(billType, billNumber)
  if (!normalized) return []

  const url = new URL(`${LDA_BASE}/filings/`)
  url.searchParams.set('filing_type', 'LD2')
  url.searchParams.set('issue_bill_number', normalized)
  url.searchParams.set('page_size', '20')

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (LDA_API_KEY) headers['Authorization'] = `Token ${LDA_API_KEY}`

  try {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 86400 }, // 24h cache
    })
    if (!res.ok) return []

    const data: {
      results?: Array<{
        registrant?: { name?: string }
        client?: { name?: string }
        lobbying_activities?: Array<{ description?: string }>
        income?: string | null
        expenses?: string | null
      }>
    } = await res.json()

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

    return filings.slice(0, 10)
  } catch {
    return []
  }
}
