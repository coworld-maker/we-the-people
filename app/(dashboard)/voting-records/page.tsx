// Retired (Jun 2026) — voting records are a denormalized slice of the
// per-member scorecard (its "Voting" tab). Consolidated to reduce three
// overlapping rep pages down to two (My Reps + Scorecards). Permanent
// redirect so any existing links/bookmarks land on the scorecard directory.

import { redirect } from 'next/navigation'

export default function VotingRecordsRedirect() {
  redirect('/scorecards')
}
