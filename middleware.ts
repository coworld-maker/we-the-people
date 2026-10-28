import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',                          // landing page
  '/privacy',                   // legal pages must be readable signed out
  '/terms',
  '/about',                     // founder page
  '/sign-in(.*)',               // CRITICAL: prevents redirect loop on mobile Safari
  '/sign-up(.*)',               // CRITICAL: prevents redirect loop on mobile Safari

  // ── Browsing pages — public until you vote or comment ───────────────────
  // Signing up is only required for write actions (voting on a bill, posting
  // a comment). All read/browse pages are open so visitors can explore before
  // committing to an account.
  '/bills(.*)',                 // bills list + detail pages — public for SEO
  '/elections(.*)',             // FEC Senate races, ratings, House counts
  '/ballot(.*)',                // per-state Nov 3 races — public for SEO
  '/news(.*)',                  // news feed — no per-user data
  '/documents(.*)',             // reference documents — read-only
  '/policy-areas(.*)',          // policy browsing
  '/my-representatives(.*)',    // rep profiles — public (no personal data until signed in)
  '/scorecards(.*)',            // congressional scorecards
  '/voting-records(.*)',        // roll call votes
  '/states(.*)',                // state-level pages
  '/state-bills(.*)',           // state legislature browser — its page gate is gone too
  '/learn(.*)',                 // civic education
  '/act(.*)',                   // action hub (links to external resources)
  '/transparency(.*)',          // site stats + data sources
  '/get-started(.*)',           // onboarding (shown signed-out too)

  '/robots.txt',                // crawlers: both were answered with a 307 to /sign-in
  '/sitemap.xml',
  // Read-only data behind public bill-page sections. The matcher is by path,
  // not method: every write handler on these routes (generate impacts, post,
  // delete) runs its own auth check and stays signed-in only.
  '/api/bills/(.*)/state-impact',     // stored per-state impact analysis
  '/api/bills/(.*)/state-sentiment',  // per-state vote totals, no identities
  '/api/bills/(.*)/discussions',      // comments; authors as usernames, never real names
  '/api/sync-bills',            // bill sync (protected by CRON_SECRET)
  '/api/sync-congress-votes',   // vote sync (protected by CRON_SECRET)
  '/api/sync-representatives',  // rep sync (protected by CRON_SECRET)
  '/api/sync-fec-ids',          // FEC ID sync (protected by CRON_SECRET)
  '/api/sync-committees',       // committee assignments sync (protected by CRON_SECRET)
  '/api/sync-lobbying',         // LDA lobbying firm count sync (protected by CRON_SECRET)
  '/api/sync-news',             // per-bill news sync (protected by CRON_SECRET)
  '/api/sync-summaries',        // AI summary pre-warm (protected by CRON_SECRET)
  '/api/cron/digest',           // weekly email digest (Vercel cron; protected by CRON_SECRET / cron header)
  '/api/landing/reps-by-zip',   // public zip->reps lookup for the landing hero
  '/api/landing/district-by-address', // public street address->district (Census geocoder) for ambiguous ZIPs; address never stored/logged
  '/api/landing/rep-votes',     // public: each shown rep's latest passage votes (public roll-call facts)
  '/api/alignment',            // alignment API
  '/api/scorecard/(.*)',        // scorecard API
  '/api/track',                 // anonymous analytics — signed-out share-link visitors included
  // Read-only APIs backing the public browsing pages above.
  // Write actions in these handlers (POST /api/votes, POST discussions, etc.)
  // run their own auth.protect() call — the middleware only controls page access.
  '/api/representatives(.*)',   // rep profiles, committee assignments
  '/api/voting-records(.*)',    // congressional roll call votes
  '/api/elections(.*)',         // FEC senate races, election data
  '/api/states(.*)',            // state-level data
  '/api/search(.*)',            // search — useful signed-out
  '/api/news(.*)',              // news articles
  '/api/webhooks/(.*)',         // inbound mail forwarder (verified by Svix signature, not a session)
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId } = await auth();
  if (userId) return;

  // API callers keep the existing response; there's no page to send them to.
  if (req.nextUrl.pathname.startsWith('/api/') || req.nextUrl.pathname.startsWith('/trpc/')) {
    await auth.protect();
    return;
  }

  // A signed-out person opening a signed-in page (e.g. /dashboard, /states/GA)
  // got a bare 404 from auth.protect(), which reads as "this page doesn't
  // exist". Send them to sign in and back to where they were going instead.
  // Path + query only (never a full URL), so this can't become an open redirect.
  const signIn = new URL('/sign-in', req.url);
  signIn.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(signIn);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
