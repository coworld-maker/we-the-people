/**
 * /robots.txt
 *
 * There was no robots file at all, and the auth middleware answered the
 * request with a 307 to /sign-in — so every crawler that asked what it may
 * read was told to log in. Four Google visits in 30 days against 5,600+
 * public pages was the result.
 *
 * Allow the public reading surface; keep crawlers out of anything that needs
 * a session (those paths redirect to /sign-in and are worthless in an index).
 */

import type { MetadataRoute } from 'next'

const SITE = 'https://www.democracyunlocked.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/sign-in',
          '/sign-up',
          '/dashboard',
          '/account',
          '/moderation',
          '/my-representatives',
          '/action-center',
          '/get-started',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
