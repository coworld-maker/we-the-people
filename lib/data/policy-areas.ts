/**
 * Canonical list of Congressional Research Service (CRS) policy areas.
 * Source: https://www.congress.gov/help/field-values/policy-area
 *
 * Used by:
 *   - AI bill categorization (constrains Claude to one of these labels)
 *   - Filter dropdowns and policy-area badges in the UI
 */
export const POLICY_AREAS = [
  'Agriculture and Food',
  'Animals',
  'Armed Forces and National Security',
  'Arts, Culture, Religion',
  'Civil Rights and Liberties, Minority Issues',
  'Commerce',
  'Congress',
  'Crime and Law Enforcement',
  'Economics and Public Finance',
  'Education',
  'Emergency Management',
  'Energy',
  'Environmental Protection',
  'Families',
  'Finance and Financial Sector',
  'Foreign Trade and International Finance',
  'Government Operations and Politics',
  'Health',
  'Housing and Community Development',
  'Immigration',
  'International Affairs',
  'Labor and Employment',
  'Law',
  'Native Americans',
  'Public Lands and Natural Resources',
  'Science, Technology, Communications',
  'Social Sciences and History',
  'Social Welfare',
  'Sports and Recreation',
  'Taxation',
  'Transportation and Public Works',
  'Water Resources Development',
] as const

export type PolicyArea = typeof POLICY_AREAS[number]

const POLICY_AREA_SET = new Set<string>(POLICY_AREAS)

export function isValidPolicyArea(s: string): s is PolicyArea {
  return POLICY_AREA_SET.has(s)
}
