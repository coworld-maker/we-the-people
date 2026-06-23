// Build the canonical congress.gov URL for a bill.
//
// IMPORTANT: the congress.gov path segment depends on the bill TYPE, not just
// the chamber. Deriving it from originChamber (house-bill / senate-bill) sent
// every resolution to the wrong measure — e.g. HRES 123 -> /house-bill/123,
// which congress.gov resolves to H.R. 123, a completely different bill.

// Map our stored billType codes (HR, S, HRES, …) to congress.gov path segments.
const BILL_TYPE_SEGMENT: Record<string, string> = {
  HR: 'house-bill',
  S: 'senate-bill',
  HRES: 'house-resolution',
  SRES: 'senate-resolution',
  HJRES: 'house-joint-resolution',
  SJRES: 'senate-joint-resolution',
  HCONRES: 'house-concurrent-resolution',
  SCONRES: 'senate-concurrent-resolution',
}

/**
 * Returns the congress.gov bill URL, or null if the billType is unrecognized
 * (so callers can hide the link rather than point at the wrong bill).
 */
export function congressGovBillUrl(bill: {
  congress: number | string
  billType: string
  billNumber: number | string
}): string | null {
  const segment = BILL_TYPE_SEGMENT[bill.billType?.toUpperCase()]
  if (!segment) return null
  return `https://www.congress.gov/bill/${bill.congress}th-congress/${segment}/${bill.billNumber}`
}
