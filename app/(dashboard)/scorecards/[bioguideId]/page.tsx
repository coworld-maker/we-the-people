// app/(dashboard)/scorecards/[bioguideId]/page.tsx
import ScorecardDetailPage from '@/components/scorecards/ScorecardDetailPage'

export const metadata = {
  title: 'Official Scorecard',
}

export default async function Page() {
  return <ScorecardDetailPage />
}
