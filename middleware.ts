import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',                          // landing page
  '/sign-in(.*)',               // CRITICAL: prevents redirect loop on mobile Safari
  '/sign-up(.*)',               // CRITICAL: prevents redirect loop on mobile Safari
  '/bills',                     // bills list — public for SEO
  '/bills/(.*)',                // bill detail pages — public for SEO
  '/api/sync-bills',            // bill sync (protected by CRON_SECRET)
  '/api/sync-congress-votes',   // vote sync (protected by CRON_SECRET)
  '/api/sync-representatives',  // rep sync (protected by CRON_SECRET)
  '/api/sync-fec-ids',          // FEC ID sync (protected by CRON_SECRET)
  '/api/cron/sync',             // daily cron orchestrator (protected by CRON_SECRET)
  '/api/alignment',             // alignment API
  '/api/debug-vote',            // temporary debug
  '/api/scorecard/(.*)',        // scorecard API
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
