/**
 * Three forecasters' ratings for one race, always together and always in the
 * same order, so no outlet's call reads as the site's own. Data and sources:
 * lib/data/forecasts.ts. Class names live here (not in lib/) because Tailwind
 * only scans app/ and components/.
 */

import { FORECASTERS, FORECASTS_CHECKED, type RaceRatings, type Rating } from '@/lib/data/forecasts'

const RATING_CLS: Record<Rating, string> = {
  'Solid D':  'bg-blue-100 text-blue-800 border-blue-300',
  'Safe D':   'bg-blue-100 text-blue-800 border-blue-300',
  'Likely D': 'bg-blue-50 text-blue-700 border-blue-200',
  'Lean D':   'bg-blue-50/60 text-blue-600 border-blue-200/60',
  'Tilt D':   'bg-sky-50 text-sky-700 border-sky-200',
  'Toss-up':  'bg-amber-50 text-amber-700 border-amber-200',
  'Tilt R':   'bg-rose-50 text-rose-700 border-rose-200',
  'Lean R':   'bg-orange-50 text-orange-700 border-orange-200',
  'Likely R': 'bg-red-50/60 text-red-600 border-red-200/60',
  'Safe R':   'bg-red-50 text-red-700 border-red-200',
  'Solid R':  'bg-red-50 text-red-700 border-red-200',
}

// Not the shared .badge class: globals.css defines it inside @layer utilities,
// where its grey background and text override these colour classes.
export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded border text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${RATING_CLS[rating]}`}>
      {rating}
    </span>
  )
}

/** The three ratings as label/badge pairs; wraps to rows on narrow screens. */
export default function ForecastRatings({ ratings }: { ratings: RaceRatings }) {
  return (
    <dl className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {FORECASTERS.map(f => (
        <div key={f.key} className="flex items-center gap-1">
          <dt className="text-[10px] text-[--text-muted]">{f.short}</dt>
          <dd><RatingBadge rating={ratings[f.key]} /></dd>
        </div>
      ))}
    </dl>
  )
}

/** One line naming each outlet and its own last update, for under a ratings list. */
export function ForecastSources({ office }: { office: 'governor' | 'senate' }) {
  return (
    <p className="text-[10px] text-[--text-muted]">
      Ratings:{' '}
      {FORECASTERS.map((f, i) => (
        <span key={f.key}>
          {i > 0 && ' · '}
          {f.name} ({f.asOf[office]})
        </span>
      ))}
      . Entered by hand, checked {FORECASTS_CHECKED}. Forecasts, not results.
    </p>
  )
}
