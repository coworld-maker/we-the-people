import { auth } from '@clerk/nextjs/server'

/**
 * Admin check utility.
 * 
 * Set ADMIN_USER_IDS in your .env with comma-separated Clerk user IDs:
 * ADMIN_USER_IDS=user_2abc123,user_2def456
 * 
 * To find your Clerk user ID:
 * 1. Go to dashboard.clerk.com → Users
 * 2. Click your user → Copy the user ID (starts with "user_")
 * 3. Add it to ADMIN_USER_IDS in your Vercel environment variables
 */

export function isAdminUserId(clerkUserId: string): boolean {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || []
  return adminIds.includes(clerkUserId)
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  return isAdminUserId(userId)
}
