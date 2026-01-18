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
        timeout: 10000,
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
