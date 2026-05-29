/**
 * Google Civic Information API v2 wrapper.
 * Docs: https://developers.google.com/civic-information/docs/v2
 *
 * Requires GOOGLE_CIVIC_API_KEY env var.
 * All methods return graceful empty results when the key is absent.
 */

const API_BASE = 'https://www.googleapis.com/civicinfo/v2'

export interface CivicElection {
  id: string
  name: string
  electionDay: string   // YYYY-MM-DD
  ocdDivisionId: string // e.g. "ocd-division/country:us"
}

export class CivicService {
  static isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_CIVIC_API_KEY)
  }

  /**
   * Returns all upcoming (and very recently past) elections known to the
   * Google Civic Information API. Results are sorted ascending by date.
   */
  static async getElections(): Promise<CivicElection[]> {
    const key = process.env.GOOGLE_CIVIC_API_KEY
    if (!key) return []

    try {
      const res = await fetch(`${API_BASE}/elections?key=${key}`, {
        next: { revalidate: 3600 }, // 1-hour cache
      })
      if (!res.ok) {
        console.warn(`Google Civic API ${res.status}`)
        return []
      }
      const data = await res.json()
      const raw: Array<{ id: string; name: string; electionDay: string; ocdDivisionId: string }> =
        data.elections ?? []

      // Filter out the test election Google always includes (id: '2000')
      return raw
        .filter(e => e.id !== '2000')
        .sort((a, b) => a.electionDay.localeCompare(b.electionDay))
    } catch (e) {
      console.error('Google Civic elections fetch failed:', e)
      return []
    }
  }
}
