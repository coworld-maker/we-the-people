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
  '/api/sync-committees',       // committee assignments sync (protected by CRON_SECRET)
  '/api/sync-lobbying',         // LDA lobbying firm count sync (protected by CRON_SECRET)
  '/api/sync-news',             // per-bill news sync (protected by CRON_SECRET)
  '/api/sync-summaries',        // AI summary pre-warm (protected by CRON_SECRET)
  '/api/cron/digest',           // weekly email digest (Vercel cron; protected by CRON_SECRET / cron header)
  '/api/landing/reps-by-zip',   // public zip->reps lookup for the landing hero
  '/api/alignment',             // alignment API
  '/api/scorecard/(.*)',        // scorecard API
  '/api/track',                 // anonymous analytics — signed-out share-link visitors included
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
