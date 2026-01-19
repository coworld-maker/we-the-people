import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * TEMPORARY BYPASS MIDDLEWARE - FOR TESTING ONLY!
 * 
 * This middleware does NO authentication checking.
 * Use this to test if your app works without Clerk.
 * 
 * If this works, the issue is with Clerk configuration.
 * If this still fails, the issue is elsewhere.
 * 
 * DO NOT use this in production - no security!
 */

export function middleware(request: NextRequest) {
  // Just pass through all requests - no auth checking
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
