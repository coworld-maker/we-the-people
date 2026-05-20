/**
 * Deterministic per-state impact weights by CRS policy area.
 *
 * Used as a free, defensible alternative to AI-generated state impacts
 * for common policy areas. When this file has data for a bill's policyArea,
 * the BillImpactMap renders instantly with zero AI cost.
 *
 * Weights are 0.0–1.0:
 *   0.0–0.4   baseline / minimal direct exposure
 *   0.4–0.6   moderate exposure
 *   0.6–0.8   high exposure
 *   0.8–1.0   sector- or geography-defining for the state
 *
 * Sources (publicly verifiable, no AI):
 *   - USDA Economic Research Service (agriculture)
 *   - EIA State Energy Profiles (energy)
 *   - BLM Public Land Statistics (federal land share)
 *   - DHS Yearbook of Immigration Statistics
 *   - DoD base/personnel reports (military presence)
 *   - Census ACS (housing costs, demographics)
 *   - BLS QCEW (sector employment)
 *
 * This is intentionally a "good-enough" heuristic, not a precise model.
 * Anywhere it's wrong or coarse, AI fallback still exists.
 */

export interface StateImpact {
  score: number
  reason: string
}

const BASELINE_SCORE = 0.3

interface AreaConfig {
  /** Shown when a state appears in `weights` */
  reasonHigh: (state: string) => string
  /** Shown for unlisted states (baseline) */
  reasonLow: string
  /** Explicit per-state scores. Unlisted states get BASELINE_SCORE. */
  weights: Record<string, number>
}

// ── All 51 codes — DC included ───────────────────────────────────────────────
const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
]

// ── Per-area configurations ──────────────────────────────────────────────────

const CONFIGS: Record<string, AreaConfig> = {
  'Agriculture and Food': {
    reasonHigh: () => 'Major agricultural producer; sector is a large share of state GDP',
    reasonLow: 'Limited agricultural sector relative to other states',
    weights: {
      IA: 0.95, NE: 0.92, KS: 0.85, IL: 0.85, MN: 0.82, IN: 0.78, MO: 0.75,
      ND: 0.80, SD: 0.78, WI: 0.78, AR: 0.80, TX: 0.78, CA: 0.85, MT: 0.72,
      KY: 0.65, OK: 0.68, GA: 0.65, NC: 0.65, OH: 0.60, MS: 0.65, AL: 0.60,
      WA: 0.62, OR: 0.55, ID: 0.68, CO: 0.55, FL: 0.55, MI: 0.50, PA: 0.45,
    },
  },

  'Energy': {
    reasonHigh: () => 'Major energy producer; sector central to state economy',
    reasonLow: 'Energy consumer; limited domestic production',
    weights: {
      TX: 0.98, WV: 0.92, WY: 0.92, ND: 0.90, AK: 0.92, LA: 0.88, OK: 0.85,
      NM: 0.82, PA: 0.78, CO: 0.72, KY: 0.72, MT: 0.70, KS: 0.65, UT: 0.65,
      OH: 0.55, CA: 0.62, AL: 0.55, MS: 0.55, IL: 0.55, IA: 0.55,
    },
  },

  'Public Lands and Natural Resources': {
    reasonHigh: () => 'Large share of land federally owned; lands policy directly affects state',
    reasonLow: 'Minimal federally-owned land within state',
    weights: {
      NV: 0.98, UT: 0.92, AK: 0.90, ID: 0.88, OR: 0.78, WY: 0.78, CA: 0.72,
      AZ: 0.72, CO: 0.65, NM: 0.65, MT: 0.72, WA: 0.55, HI: 0.55, NH: 0.40,
    },
  },

  'Water Resources Development': {
    reasonHigh: () => 'Coastal or major-river state with significant water-infrastructure exposure',
    reasonLow: 'Limited direct exposure to federal water infrastructure',
    weights: {
      LA: 0.95, FL: 0.90, MS: 0.85, AL: 0.80, TX: 0.78, CA: 0.78, NC: 0.72,
      SC: 0.72, GA: 0.65, VA: 0.65, NY: 0.62, NJ: 0.60, MD: 0.62, OR: 0.55,
      WA: 0.62, AK: 0.65, HI: 0.65, ME: 0.55, AR: 0.65, MO: 0.60, IL: 0.55,
      IA: 0.50, MN: 0.50, TN: 0.55, KY: 0.55,
    },
  },

  'Immigration': {
    reasonHigh: () => 'Border state or top immigrant-population state',
    reasonLow: 'Smaller immigrant population; less direct policy exposure',
    weights: {
      TX: 0.95, AZ: 0.92, CA: 0.92, NM: 0.85, FL: 0.85, NY: 0.78, NJ: 0.72,
      IL: 0.70, NV: 0.68, MA: 0.62, GA: 0.60, WA: 0.58, CO: 0.55, VA: 0.55,
      MD: 0.55, CT: 0.50,
    },
  },

  'Foreign Trade and International Finance': {
    reasonHigh: () => 'Major port state or large export sector',
    reasonLow: 'Limited international-trade exposure',
    weights: {
      CA: 0.92, TX: 0.92, NY: 0.85, WA: 0.85, MI: 0.78, IL: 0.72, OH: 0.70,
      NJ: 0.72, GA: 0.68, FL: 0.68, LA: 0.72, IN: 0.65, KY: 0.62, PA: 0.62,
      SC: 0.65, TN: 0.62, NC: 0.62, MN: 0.55, OR: 0.55, MA: 0.55,
    },
  },

  'Armed Forces and National Security': {
    reasonHigh: () => 'Significant military installations or defense-industry presence',
    reasonLow: 'Smaller military footprint within state',
    weights: {
      VA: 0.95, CA: 0.88, TX: 0.88, FL: 0.82, GA: 0.78, NC: 0.82, HI: 0.85,
      WA: 0.75, MD: 0.72, AK: 0.72, KY: 0.65, OK: 0.62, KS: 0.62, MS: 0.62,
      LA: 0.60, AL: 0.62, AZ: 0.60, CO: 0.62, MA: 0.55, CT: 0.62, NJ: 0.55,
      OH: 0.55, MO: 0.55, NM: 0.62, NV: 0.55,
    },
  },

  'Native Americans': {
    reasonHigh: () => 'Large tribal population or significant tribal lands within state',
    reasonLow: 'Smaller tribal population relative to other states',
    weights: {
      AK: 0.98, OK: 0.92, NM: 0.92, AZ: 0.90, SD: 0.88, MT: 0.85, ND: 0.78,
      WY: 0.72, ID: 0.68, MN: 0.62, WI: 0.62, WA: 0.65, OR: 0.55, NV: 0.60,
      UT: 0.60, NC: 0.55, MS: 0.50, NE: 0.55, KS: 0.50,
    },
  },

  'Housing and Community Development': {
    reasonHigh: () => 'High housing costs and major federal-housing-program exposure',
    reasonLow: 'Lower housing costs relative to national average',
    weights: {
      CA: 0.92, NY: 0.85, HI: 0.88, MA: 0.85, NJ: 0.78, WA: 0.75, CT: 0.72,
      MD: 0.68, CO: 0.65, OR: 0.65, FL: 0.65, IL: 0.55, AZ: 0.58, NV: 0.62,
      DC: 0.85, VA: 0.62, RI: 0.62, NH: 0.55,
    },
  },

  'Environmental Protection': {
    reasonHigh: () => 'Significant coastline, large protected lands, or major industrial-emission exposure',
    reasonLow: 'Smaller direct EPA-regulation footprint',
    weights: {
      CA: 0.85, FL: 0.82, LA: 0.80, TX: 0.82, AK: 0.85, NY: 0.65, WA: 0.72,
      OR: 0.70, ME: 0.65, MA: 0.62, NJ: 0.62, NC: 0.65, SC: 0.62, VA: 0.62,
      MI: 0.65, MN: 0.62, WI: 0.62, HI: 0.78, NV: 0.55, AZ: 0.55,
    },
  },
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Return per-state impact scores for a policy area, or null if we don't
 * have a deterministic mapping (caller should fall back to AI).
 *
 * Always returns a full 51-state map (DC + all 50) when non-null,
 * filling unlisted states with the baseline score and low-impact reason.
 */
export function getStateImpactsForPolicyArea(
  policyArea: string | null,
): Record<string, StateImpact> | null {
  if (!policyArea) return null
  const config = CONFIGS[policyArea]
  if (!config) return null

  const out: Record<string, StateImpact> = {}
  for (const state of ALL_STATES) {
    const explicit = config.weights[state]
    if (typeof explicit === 'number') {
      out[state] = { score: explicit, reason: config.reasonHigh(state) }
    } else {
      out[state] = { score: BASELINE_SCORE, reason: config.reasonLow }
    }
  }
  return out
}

/** For introspection / docs — which policy areas have deterministic data. */
export const COVERED_POLICY_AREAS = Object.keys(CONFIGS)
