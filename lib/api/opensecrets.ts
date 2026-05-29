const BASE = 'https://www.opensecrets.org/api/'

async function osGet(method: string, params: Record<string, string>) {
  const key = process.env.OPENSECRETS_API_KEY
  if (!key) return null
  try {
    const url = new URL(BASE)
    url.searchParams.set('method', method)
    url.searchParams.set('output', 'json')
    url.searchParams.set('apikey', key)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function toArray(v: unknown): any[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

export interface OSContributor { org: string; total: number; pacs: number; indivs: number }
export interface OSIndustry    { industry_code: string; industry_name: string; total: number; indivs: number; pacs: number }
export interface OSLegislator  { cid: string; firstlastp: string; party: string; stateid: string; bioguide_id: string }

export class OpenSecretsAPI {
  static async getLegislators(stateId: string): Promise<OSLegislator[]> {
    const data = await osGet('getLegislators', { id: stateId })
    return toArray(data?.response?.legislator).map((l: any) => l['@attributes'] ?? l)
  }

  static async getTopContributors(cid: string, cycle = '2024'): Promise<OSContributor[]> {
    const data = await osGet('candContrib', { cid, cycle })
    return toArray(data?.response?.contributors?.contributor).map((c: any) => {
      const a = c['@attributes'] ?? c
      return { org: a.org_name, total: Number(a.total), pacs: Number(a.pacs), indivs: Number(a.indivs) }
    })
  }

  static async getTopIndustries(cid: string, cycle = '2024'): Promise<OSIndustry[]> {
    const data = await osGet('candIndustry', { cid, cycle })
    return toArray(data?.response?.industries?.industry).map((i: any) => {
      const a = i['@attributes'] ?? i
      return {
        industry_code: a.industry_code,
        industry_name: a.industry_name,
        total: Number(a.total),
        indivs: Number(a.indivs),
        pacs: Number(a.pacs),
      }
    })
  }
}
