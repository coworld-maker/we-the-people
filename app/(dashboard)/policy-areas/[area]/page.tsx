import { redirect } from 'next/navigation'

// Per-policy-area pages have been merged into /bills. The bills page now
// accepts a `policyArea` query param that filters the list to a single area,
// so /policy-areas/Health → /bills?policyArea=Health.
export default async function PolicyAreaRedirect({
  params,
}: {
  params: Promise<{ area: string }>
}) {
  const { area } = await params
  redirect(`/bills?policyArea=${area}`)
}
