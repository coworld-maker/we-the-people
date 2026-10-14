/**
 * /sitemap.xml — every page a signed-out visitor (or a crawler) may read.
 *
 * The site had no sitemap, so the 5,600+ public bill pages and the per-state
 * ballot pages were invisible to search. Bill pages carry their own
 * lastModified from the nightly Congress.gov sync, which is what tells Google
 * a page is worth re-crawling.
 *
 * Only public routes belong here: anything requiring a session redirects to
 * /sign-in and would just waste crawl budget. Rebuilt daily.
 */

import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { ABBR_TO_NAME } from '@/lib/utils/state-codes'

const SITE = 'https://www.democracyunlocked.com'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/bills`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/elections`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/ballot`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // One page per state — what people search in the weeks before an election
  // ("what's on my ballot in …").
  const ballotPages: MetadataRoute.Sitemap = Object.keys(ABBR_TO_NAME).map(code => ({
    url: `${SITE}/ballot/${code.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Bill pages are the bulk of the site. A failed query must not take the
  // whole sitemap down — better a short sitemap than none.
  const bills = await prisma.bill
    .findMany({
      select: { id: true, updatedAt: true },
      orderBy: { latestActionDate: 'desc' },
      take: 45_000, // sitemap limit is 50,000 URLs
    })
    .catch(() => [])

  const billPages: MetadataRoute.Sitemap = bills.map(b => ({
    url: `${SITE}/bills/${b.id}`,
    lastModified: b.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...ballotPages, ...billPages]
}
