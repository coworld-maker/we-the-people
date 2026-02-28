import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',                          // landing page
  '/api/sync-bills',            // bill sync (protected by CRON_SECRET)
  '/api/sync-congress-votes',   // vote sync (protected by CRON_SECRET)
  '/api/cron/sync',             // daily cron job (protected by CRON_SECRET)
  '/api/alignment',             // alignment API
  '/api/debug-vote',            // temporary debug
  '/api/scorecard/(.*)',
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
