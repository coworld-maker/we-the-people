/**
 * Where a visit came from: the campaign tags on the link and the site that
 * linked here. Pure functions so they can be tested without a browser.
 *
 * Privacy: only the referrer's HOSTNAME is kept, never the full referring URL
 * (which can carry search terms or profile paths), and same-site navigation is
 * dropped entirely. Campaign tags are values we put in our own links.
 */

export interface Attribution {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referrerHost?: string
}

/** Long values are someone stuffing the URL, not a campaign name. */
const MAX = 80

function clean(value: string | null | undefined): string | undefined {
  const v = (value ?? '').trim()
  return v ? v.slice(0, MAX) : undefined
}

/** "?utm_source=instagram&utm_content=r4" → { utmSource, utmContent }. */
export function parseUtm(search: string): Attribution {
  let params: URLSearchParams
  try {
    params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  } catch {
    return {}
  }
  const map = {
    utmSource: 'utm_source',
    utmMedium: 'utm_medium',
    utmCampaign: 'utm_campaign',
    utmContent: 'utm_content',
    utmTerm: 'utm_term',
  } as const
  const out: Attribution = {}
  for (const key of Object.keys(map) as Array<keyof typeof map>) {
    const v = clean(params.get(map[key]))
    if (v) out[key] = v
  }
  return out
}

/**
 * Hostname of an external referrer. Returns undefined for same-site links,
 * a missing referrer, or anything unparseable — so "no value" always means
 * "came in directly or from within the site".
 */
export function referrerHost(referrer: string | null | undefined, ownHost: string): string | undefined {
  if (!referrer) return undefined
  let host: string
  try {
    host = new URL(referrer).hostname
  } catch {
    return undefined
  }
  if (!host) return undefined
  const own = (ownHost || '').split(':')[0].replace(/^www\./, '')
  if (own && host.replace(/^www\./, '') === own) return undefined
  return host.slice(0, MAX)
}

/** True when anything worth remembering was found. */
export function hasAttribution(a: Attribution): boolean {
  return Object.values(a).some(Boolean)
}
