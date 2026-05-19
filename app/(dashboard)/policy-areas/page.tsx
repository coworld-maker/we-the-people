import { redirect } from 'next/navigation'

// The standalone policy-areas page has been merged into /bills.
// /bills?groupBy=policy is the grouped-by-policy view, which preserves
// the same overview while sharing filters with the main bills list.
export default function PolicyAreasIndexPage() {
  redirect('/bills?groupBy=policy')
}
