/**
 * Thin wrapper around the OpenStates v3 API for fetching state-legislature bills.
 * Docs: https://docs.openstates.org/api-v3/
 *
 * If `OPENSTATES_API_KEY` is not set, all methods return empty results
 * gracefully so the rest of the app works without the integration.
 */

const API_BASE = 'https://v3.openstates.org'

// OpenStates uses jurisdiction OCD IDs; map our 2-letter code to the OCD form
function jurisdictionForState(code: string): string {
  return `ocd-jurisdiction/country:us/state:${code.toLowerCase()}/government`
}

export interface StateLegBill {
  id: string                  // OpenStates bill ID
  identifier: string          // e.g. 'HB 123'
  title: string
  classification: string[]    // e.g. ['bill']
  subject: string[]
  session: string
  firstActionDate: string | null
  latestActionDate: string | null
  latestActionDescription: string | null
  openstatesUrl: string
}

interface OpenStatesBillRaw {
  id: string
  identifier: string
  title: string
  classification?: string[]
  subject?: string[]
  session: string
  first_action_date?: string | null
  latest_action_date?: string | null
  latest_action_description?: string | null
  openstates_url: string
}

export class OpenStatesService {
  static isConfigured(): boolean {
    return Boolean(process.env.OPENSTATES_API_KEY)
  }

  /**
   * Returns the most recently-updated bills in a state's legislature.
   * Returns empty array if API key is missing or the request fails.
   */
  static async getRecentBills(stateCode: string, limit = 8): Promise<StateLegBill[]> {
    const apiKey = process.env.OPENSTATES_API_KEY
    if (!apiKey) return []

    const params = new URLSearchParams({
      jurisdiction: jurisdictionForState(stateCode),
      sort: 'updated_desc',
      per_page: String(Math.min(limit, 20)),
      page: '1',
    })

    try {
      const res = await fetch(`${API_BASE}/bills?${params}`, {
        headers: { 'X-API-Key': apiKey },
        next: { revalidate: 1800 }, // 30-min cache via Next.js fetch cache
      })
      if (!res.ok) {
        console.warn(`OpenStates ${res.status} for state ${stateCode}`)
        return []
      }
      const data = await res.json()
      const results: OpenStatesBillRaw[] = data.results ?? []
      return results.map(b => ({
        id: b.id,
        identifier: b.identifier,
        title: b.title,
        classification: b.classification ?? [],
        subject: b.subject ?? [],
        session: b.session,
        firstActionDate: b.first_action_date ?? null,
        latestActionDate: b.latest_action_date ?? null,
        latestActionDescription: b.latest_action_description ?? null,
        openstatesUrl: b.openstates_url,
      }))
    } catch (e) {
      console.error('OpenStates fetch failed:', e)
      return []
    }
  }
}
