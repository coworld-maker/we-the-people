import axios from 'axios'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'
const API_KEY = process.env.CONGRESS_API_KEY

interface CongressBill {
  congress: string
  type: string
  number: string
  title: string
  introducedDate: string
  latestAction?: {
    actionDate: string
    text: string
  }
  policyArea?: {
    name: string
  }
  sponsors?: Array<{
    firstName: string
    lastName: string
    party: string
    state: string
  }>
}

export class CongressAPI {
  private static async makeRequest(endpoint: string) {
    if (!API_KEY) {
      throw new Error('CONGRESS_API_KEY not configured')
    }

    try {
      const response = await axios.get(`${CONGRESS_API_BASE}${endpoint}`, {
        params: { api_key: API_KEY, format: 'json' },
        timeout: 15000,
      })
      return response.data
    } catch (error) {
      console.error('Congress API error:', error)
      throw new Error('Failed to fetch from Congress API')
    }
  }

  static async getRecentBills(congress: number = 119, limit: number = 20) {
    const data = await this.makeRequest(
      `/bill/${congress}?limit=${limit}&sort=updateDate+desc`
    )
    return data.bills || []
  }

  static async getBillDetails(congress: number, billType: string, billNumber: string) {
    const data = await this.makeRequest(
      `/bill/${congress}/${billType}/${billNumber}`
    )
    return data.bill
  }

  static async getBillText(congress: number, billType: string, billNumber: string) {
    const data = await this.makeRequest(
      `/bill/${congress}/${billType}/${billNumber}/text`
    )
    return data.textVersions || []
  }

  /**
   * Fetches the actual text content of a bill from Congress.gov.
   * 
   * The Congress API returns text versions with formats like:
   *   - "Formatted Text" → .htm (HTML file)
   *   - "PDF" → .pdf
   *   - "Formatted XML" → .xml
   * 
   * We fetch the "Formatted Text" (HTML) and strip tags to get clean text.
   */
  static async fetchBillTextContent(
    congress: number,
    billType: string,
    billNumber: string
  ): Promise<string | null> {
    try {
      const textVersions = await this.getBillText(congress, billType, billNumber)

      if (!textVersions || textVersions.length === 0) {
        console.warn(`No text versions for ${billType}${billNumber}`)
        return null
      }

      // Get the most recent text version (first in list)
      const latestVersion = textVersions[0]
      const formats = latestVersion?.formats || []

      if (formats.length === 0) {
        console.warn(`No formats available for ${billType}${billNumber}`)
        return null
      }

      // Prefer "Formatted Text" (HTML) — this is what Congress API provides
      // There is no plain TXT in the API, despite the Congress.gov website showing one
      const htmlFormat = formats.find((f: any) => f.type === 'Formatted Text')
      const xmlFormat = formats.find((f: any) => f.type === 'Formatted XML')

      const targetFormat = htmlFormat || xmlFormat
      if (!targetFormat?.url) {
        console.warn(`No fetchable text format for ${billType}${billNumber}. Available:`, formats.map((f: any) => f.type))
        return null
      }

      console.log(`Fetching bill text from: ${targetFormat.url}`)

      const textResponse = await axios.get(targetFormat.url, {
        timeout: 15000,
        responseType: 'text',
        maxRedirects: 5,
        headers: {
          'Accept': 'text/html, application/xhtml+xml, text/plain, */*',
          'User-Agent': 'DemocracyUnlocked/1.0',
        },
      })

      if (typeof textResponse.data !== 'string' || textResponse.data.length === 0) {
        console.warn(`Empty response from ${targetFormat.url}`)
        return null
      }

      let text = textResponse.data

      // Strip HTML to get clean text
      // First preserve meaningful whitespace from block elements
      text = text.replace(/<br\s*\/?>/gi, '\n')
      text = text.replace(/<\/p>/gi, '\n\n')
      text = text.replace(/<\/div>/gi, '\n')
      text = text.replace(/<\/h[1-6]>/gi, '\n\n')
      text = text.replace(/<\/li>/gi, '\n')
      text = text.replace(/<\/tr>/gi, '\n')
      text = text.replace(/<hr\s*\/?>/gi, '\n---\n')

      // Remove all remaining HTML tags
      text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      text = text.replace(/<[^>]+>/g, '')

      // Decode HTML entities
      text = text.replace(/&amp;/g, '&')
      text = text.replace(/&lt;/g, '<')
      text = text.replace(/&gt;/g, '>')
      text = text.replace(/&quot;/g, '"')
      text = text.replace(/&#39;/g, "'")
      text = text.replace(/&nbsp;/g, ' ')
      text = text.replace(/&mdash;/g, '—')
      text = text.replace(/&ndash;/g, '–')
      text = text.replace(/&lsquo;/g, "'")
      text = text.replace(/&rsquo;/g, "'")
      text = text.replace(/&ldquo;/g, '"')
      text = text.replace(/&rdquo;/g, '"')
      text = text.replace(/&#\d+;/g, '') // Remove remaining numeric entities

      // Clean up whitespace
      text = text.replace(/[ \t]+/g, ' ')        // Collapse horizontal whitespace
      text = text.replace(/\n /g, '\n')            // Remove leading spaces after newlines
      text = text.replace(/ \n/g, '\n')            // Remove trailing spaces before newlines
      text = text.replace(/\n{3,}/g, '\n\n')      // Collapse excessive newlines
      text = text.trim()

      if (text.length < 50) {
        console.warn(`Text too short (${text.length} chars) for ${billType}${billNumber}, likely parsing error`)
        return null
      }

      console.log(`Successfully fetched ${text.length} chars of text for ${billType}${billNumber}`)
      return text
    } catch (error) {
      console.error(`Failed to fetch bill text for ${billType}${billNumber}:`, error)
      return null
    }
  }

  static async getBillActions(congress: number, billType: string, billNumber: string) {
    const data = await this.makeRequest(
      `/bill/${congress}/${billType}/${billNumber}/actions`
    )
    return data.actions || []
  }

  static async searchBills(query: string, limit: number = 20) {
    const data = await this.makeRequest(
      `/bill?limit=${limit}&query=${encodeURIComponent(query)}`
    )
    return data.bills || []
  }

  static async getCurrentMembers(chamber: 'house' | 'senate') {
    const congress = 119
    const data = await this.makeRequest(
      `/member/${congress}/${chamber}`
    )
    return data.members || []
  }

  static async fetchMostViewedBills(): Promise<Array<{ congress: string; billType: string; billNumber: string }>> {
    const TYPE_MAP: Record<string, string> = {
      'house': 'HR', 'senate': 'S',
      'house-joint-resolution': 'HJRES', 'senate-joint-resolution': 'SJRES',
      'house-concurrent-resolution': 'HCONRES', 'senate-concurrent-resolution': 'SCONRES',
      'house-resolution': 'HRES', 'senate-resolution': 'SRES',
    }
    try {
      const res = await fetch('https://www.congress.gov/most-viewed-bills', {
        headers: { 'User-Agent': 'DemocracyUnlocked/1.0', 'Accept': 'text/html' },
        next: { revalidate: 3600 },
      })
      if (!res.ok) return []
      const html = await res.text()
      const pattern = /\/bill\/(\d+)th-congress\/([\w-]+)-bill\/(\d+)/g
      const seen = new Set<string>()
      const bills: Array<{ congress: string; billType: string; billNumber: string }> = []
      let match
      while ((match = pattern.exec(html)) !== null) {
        const [, congress, typePart, billNumber] = match
        const billType = TYPE_MAP[typePart] ?? typePart.replace(/-/g, '').toUpperCase()
        const key = `${congress}-${billType}-${billNumber}`
        if (!seen.has(key)) { seen.add(key); bills.push({ congress, billType, billNumber }) }
      }
      return bills.slice(0, 20)
    } catch { return [] }
  }
}
