# ▶ RESUME HERE — fast bootstrap for the next session

_Last updated: 2026-09-02. This is the "start here" file. Latest detail:
[2026-09-02-lobbying-dollar-attribution.md](./2026-09-02-lobbying-dollar-attribution.md)
(prior: [2026-08-24-data-correctness-sweep.md](./2026-08-24-data-correctness-sweep.md),
[2026-06-29-summaries-crons-links-launchprep.md](./2026-06-29-summaries-crons-links-launchprep.md))
(prior: [2026-06-27-roster-audit-codereview.md](./2026-06-27-roster-audit-codereview.md),
[2026-06-19-mobile-rep-data-fixes.md](./2026-06-19-mobile-rep-data-fixes.md))._

## 30-second context
Democracy Unlocked™ — civic app, Next.js 15 on Vercel, public repo (AGPL), Supabase/Prisma, Clerk auth.
**Local `node_modules` IS installed as of 2026-09-02** — `./node_modules/.bin/tsc --noEmit` and `npm test` both run locally, no push needed. (Older passdowns say "no local Node"; that's stale.)
But there are **no `.env` files**, so the app itself still cannot boot locally — anything needing Prisma or Clerk must be verified on a Vercel preview.
GitHub Actions `test.yml` = unit tests.
Strategic moat: **community + accountability** (citizen voting, discussions, money-in-politics), not AI summaries.

## Recently fixed (2026-06-27)
Congressional roster audit (all 50 states vs 2020 apportionment) → 4 stale members retired (Apr-2026 deaths/resignations) · **`sync-representatives` now auto-retires departed members** (`notIn(seen)` + `MIN_EXPECTED_MEMBERS=400` guard — was append-only) · high-effort code review fixed 10 bugs incl. **a `CRON_SECRET`-unset auth bypass on every sync route** (now centralized in `lib/auth/syncAuth.ts`), LDA firm over-count, FEC `Math.max(...[])`→`-Infinity`, dashboard "mismatches this week" accuracy, `VotingPanel` double-count on re-vote. All merged via **PR #13 → `e5e8682`**.
**In-flight:** `landing-broadsheet` branch (1 commit, live preview) — ZIP→your-reps product hero, **not yet merged**, decide first.
**Known silent-empty risks (not fixed):** `/elections` (static fallback now exists, but live data still needs retired Google Civic API), lobbying firm-count badge (sync-lobbying unscheduled), `OPEN_FEC_API_KEY` unset in Vercel. See latest passdown §3.

## ⛳ Status (2026-09-02)
**✅ SHIPPED AND VERIFIED IN PRODUCTION** — `main` @ `19bd223`, confirmed on the live H.R. 3633 page.
Three money figures on the bill page each stated something untrue while being accurately transcribed:
LDA dollars read as per-bill spend; FEC donor figures read as *companies* donating (legally impossible —
they are contributions from individuals who list that employer); and 10 filings sat under a "32 lobbying
firms" badge with nothing labelling the cap. All three now carry the qualifier the API already provided.
Also fixed: the FEC cycle label could be two years stale. Also shipped: `package-lock.json` +
`engines: node 24.x` — **note this switched Vercel to `npm ci`**, which fails the build if the lockfile and
`package.json` disagree; commit them together. Full detail: latest passdown §3, §5.1.

**🔴 OPEN — the worst finding, from the closing sweep:** the dashboard's "Your Impact" card shows a big
"Voting Alignment" donut whose value is `totalVotes / (totalVotes + 5)` — a curve over the user's own vote
count, with **no second party in the formula**. It is not alignment with anyone. Same card: "Bills you've
influenced" is just the vote count, and "Representative contacts" is a hardcoded `0`. A real alignment
calc already exists in `lib/services/alignmentService.ts` and renders honestly two cards away. See passdown §6.6.

**🟠 OPEN:** `"78% confidence"` on bill impacts is the LLM rating itself, and `impact.confidence || 70`
turns a missing value into a plausible one. Passdown §6.7.

## ⛳ Status (2026-08-24)
**🔴 AI analysis is DOWN — Anthropic credit balance exhausted since Aug 5.** Not a code bug: top up at console.anthropic.com → Plans & Billing (enable auto-reload). Everything else below is healthy.

A data-correctness sweep on 2026-08-24 fixed six silent wrong-data bugs (cross-Congress lobbying attribution, senators labeled "Rep.", inverted chamber logic, dead news linking, a sync that could never finish, and a sync that overwrote verified counts with zeros). See the latest passdown — especially §5 Learnings, which generalizes the pattern.

### Previously (2026-07-05): no blocking actions
All prior "do first" items are DONE: pushes ✅, **Clerk key rotated + verified live** ✅,
FEC + Resend keys set (donor figures verified rendering) ✅, failing daily Vercel crons removed ✅,
`/elections` static fallback ✅, AI summary refresh bug fixed + nightly pre-warm running
(782/3145 analyzed, prominent bills first) ✅, PR #13 (roster/auth fixes) + PR #14
(attendance records) merged ✅.
**UI redesign work is CANCELLED by the user** — the Broadsheet *tokens* landed (additive,
`docs/design-system.md`) but no page redesigns; the `landing-broadsheet` branch is PARKED,
do NOT merge or resume UI work unprompted. Next candidate: soft launch to real users.

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
