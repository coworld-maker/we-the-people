import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',                          // landing page
  '/privacy',                   // legal pages must be readable signed out
  '/terms',
  '/about',                     // founder page
  '/sign-in(.*)',               // CRITICAL: prevents redirect loop on mobile Safari
  '/sign-up(.*)',               // CRITICAL: prevents redirect loop on mobile Safari
  '/bills',                     // bills list — public for SEO
  '/bills/(.*)',                // bill detail pages — public for SEO
  '/elections',                 // FEC Senate races, ratings, House counts — no per-user data
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
