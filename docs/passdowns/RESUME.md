# ▶ RESUME HERE — fast bootstrap for the next session

_Last updated: 2026-06-27. This is the "start here" file. Latest detail:
[2026-06-27-roster-audit-codereview.md](./2026-06-27-roster-audit-codereview.md)
(prior: [2026-06-19-mobile-rep-data-fixes.md](./2026-06-19-mobile-rep-data-fixes.md))._

## 30-second context
Democracy Unlocked™ — civic app, Next.js 15 on Vercel, public repo (AGPL), Supabase/Prisma, Clerk auth.
No local Node → Vercel build = typechecker; GitHub Actions `test.yml` = unit tests.
Strategic moat: **community + accountability** (citizen voting, discussions, money-in-politics), not AI summaries.

## Recently fixed (2026-06-27)
Congressional roster audit (all 50 states vs 2020 apportionment) → 4 stale members retired (Apr-2026 deaths/resignations) · **`sync-representatives` now auto-retires departed members** (`notIn(seen)` + `MIN_EXPECTED_MEMBERS=400` guard — was append-only) · high-effort code review fixed 10 bugs incl. **a `CRON_SECRET`-unset auth bypass on every sync route** (now centralized in `lib/auth/syncAuth.ts`), LDA firm over-count, FEC `Math.max(...[])`→`-Infinity`, dashboard "mismatches this week" accuracy, `VotingPanel` double-count on re-vote. All merged via **PR #13 → `e5e8682`**.
**In-flight:** `landing-broadsheet` branch (1 commit, live preview) — ZIP→your-reps product hero, **not yet merged**, decide first.
**Known silent-empty risks (not fixed):** `/elections` (static fallback now exists, but live data still needs retired Google Civic API), lobbying firm-count badge (sync-lobbying unscheduled), `OPEN_FEC_API_KEY` unset in Vercel. See latest passdown §3.

## ⛳ DO THESE FIRST (in order)
1. **Decide on `landing-broadsheet`** — clean 1-commit branch w/ live preview (ZIP→your-reps hero). Merge to `main` or iterate.
2. ~~**Clerk key rotation**~~ ✅ **DONE 2026-06-27** — key rolled + `CLERK_SECRET_KEY` updated in Vercel. ⚠️ **Production must be redeployed** to pick up the new env var (a running deploy holds the old key in memory); verify sign-in on prod after the redeploy.
   _(The prior "PUSH trademark commits" item is also DONE — landed on `main` as `4626d5f`.)_

## State of play (all live unless noted)
- **News:** curated RSS (primary) + Newsdata (backup) → `/api/sync-news` → `BillNewsArticle` → `/news` (PressFeed, lean filter), dashboard teaser, bill cards. Daily cron job added. Verified: balanced L15/C10/R15.
- **Community:** usernames + moderation (`/moderation`), share-your-vote card, discussions. **Live chat removed** (redundant).
- **Consolidation done:** retired `/voting-records`→`/scorecards`, removed `WelcomeGuide`, removed duplicate vote-stats card.
- **Hardening done:** lean-label methodology owned; feed-health logging; **first unit tests + CI (green)**; `/news` section divider.

## Council open list (next candidates)
1. ~~Lean methodology~~ ✅ 2. ~~Clerk rotation~~ ✅ 3. ~~Feed-health~~ ✅ 4. ~~Tests~~ ✅ 5. ~~/news identity~~ ✅
→ Net remaining: optional **Terms ToS trademark clause** (offered, not yet drafted).

## Operate the news feed
- Manual: `/sync-admin` → enter `CRON_SECRET` (field clears on reload!) → "Sync Press Coverage".
- Auto: daily via `.github/workflows/sync-bills.yml` `sync-news` job.

## Don't relearn these
- GDELT live API 429s from Vercel IPs (→504); NewsAPI.org free = localhost-only; Newsdata free = aggregator-heavy (backup only).
- Daily GH workflow calls sync endpoints DIRECTLY (not the orchestrator) — add new syncs there too.
- All sync routes share one auth gate: `import { checkSyncAuth } from '@/lib/auth/syncAuth'`. Never re-roll an inline `Bearer ${CRON_SECRET}` check — that's the bypass we just fixed (returns true when the env var is unset).
- Append-only syncs leave the dead behind: `sync-representatives` needed a `notIn(seen)` retire step (guarded by a min-count). Any table mirroring an upstream "current" set needs the same.
