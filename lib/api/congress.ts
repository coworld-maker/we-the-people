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

  static async getRecentBills(congress: number = 118, limit: number = 20) {
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
   * Fetches the actual plain text content of a bill.
   * 1. Gets text version metadata from Congress API
   * 2. Finds the TXT format URL
   * 3. Fetches the raw text content
   * Returns null if no text is available.
   */
  static async fetchBillTextContent(
    congress: number,
    billType: string,
    billNumber: string
  ): Promise<string | null> {
    try {
      const textVersions = await this.getBillText(congress, billType, billNumber)

      if (!textVersions || textVersions.length === 0) {
        return null
      }

      // Get the most recent text version (first in list)
      const latestVersion = textVersions[0]
      const formats = latestVersion?.formats || []

      // Prefer TXT format, fall back to others
      const txtFormat = formats.find((f: any) => f.type === 'Formatted Text')
        || formats.find((f: any) => f.type === 'PDF') // won't fetch PDF, just for URL
        || formats.find((f: any) => f.url?.endsWith('.txt'))
        || formats[0]

      if (!txtFormat?.url) {
        return null
      }

      let textUrl = txtFormat.url

      // The Congress API sometimes returns URLs without the api_key
      // For .txt URLs from congress.gov, we can fetch directly
      // For API URLs, we need to add the key
      if (textUrl.includes('api.congress.gov')) {
        textUrl += textUrl.includes('?') ? `&api_key=${API_KEY}` : `?api_key=${API_KEY}`
      }

      const textResponse = await axios.get(textUrl, {
        timeout: 15000,
        responseType: 'text',
        // Some congress.gov URLs redirect, follow them
        maxRedirects: 5,
      })

      if (typeof textResponse.data === 'string' && textResponse.data.length > 0) {
        // Clean up HTML tags if present (formatted text sometimes has them)
        let text = textResponse.data
        // Remove HTML tags but preserve line breaks
        text = text.replace(/<br\s*\/?>/gi, '\n')
        text = text.replace(/<\/p>/gi, '\n\n')
        text = text.replace(/<[^>]+>/g, '')
        // Decode HTML entities
        text = text.replace(/&amp;/g, '&')
        text = text.replace(/&lt;/g, '<')
        text = text.replace(/&gt;/g, '>')
        text = text.replace(/&quot;/g, '"')
        text = text.replace(/&#39;/g, "'")
        text = text.replace(/&nbsp;/g, ' ')
        // Collapse excessive whitespace
        text = text.replace(/\n{3,}/g, '\n\n')
        text = text.trim()

        return text || null
      }

      return null
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
    const congress = 118
    const data = await this.makeRequest(
      `/member/${congress}/${chamber}`
    )
    return data.members || []
  }
}
