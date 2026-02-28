// app/(dashboard)/scorecards/[bioguideId]/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ScorecardDetailPage from '@/components/scorecards/ScorecardDetailPage'

export const metadata = {
  title: 'Official Scorecard | Democracy Unlocked',
}

export default async function Page() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return <ScorecardDetailPage />
}
