# Passdown — Congressional roster audit, auto-retire sync, and a high-effort code review

**Project:** Democracy Unlocked™ (democracyunlocked.com)
**Date:** June 27, 2026
**Repo:** `coworld-maker/we-the-people` (public, AGPL). Deploys to Vercel on push to `main`.
**Prior passdown:** [2026-06-19-mobile-rep-data-fixes.md](./2026-06-19-mobile-rep-data-fixes.md) · **Start-here:** [RESUME.md](./RESUME.md)

> No local Node → the Vercel build is the typechecker; GitHub Actions `test.yml` runs unit tests.
> Verify deploys via the Vercel MCP; DB work via the Supabase MCP (project `hiypdaqcpssqlwtgprmf`).

---

## 0. Current state of play (verified this session)

- **Production:** `READY` at `a5dd27c` (the Broadsheet design-system lock). Live and healthy.
- **`main` HEAD:** `a5dd27c`. All of this session's work is already merged into `main` (it shipped as squash-merge **`e5e8682` / PR #13** and `main` has since advanced ~14 more commits with the elections fallback, scorecard N+1 fix, and the Broadsheet design system).
- **In-flight branch:** `landing-broadsheet` (`ce7cd48`, **1 ahead / 0 behind** `main`) — a product-led landing hero: serif Broadsheet headline, honest live bill count, and the signature ZIP → your 3 members of Congress interaction for logged-out visitors (`/api/landing/reps-by-zip`). **Deployed as a preview, NOT yet merged.** Decide whether to merge it or iterate.
- **Working branch `claude/fix-vercel-deployment-Ld6an`:** was a stale ancestor of `main`; fast-forwarded to current `main` this session so this passdown sits atop reality. It carries nothing `main` doesn't have except this doc.

---

## 1. What shipped this session (all merged via PR #13 → `e5e8682`)

### A. Congressional roster audit — all 50 states, both chambers
Cross-referenced the live `Representative` table against the 2020-census apportionment and Congress.gov `currentMember=true`, with web searches to catch special elections / deaths / resignations through June 2026. **Found 4 stale records** — members who left in April 2026, after the last sync ran, that the append-only sync had never retired. Fixed by **direct Supabase SQL** (can't trigger CRON_SECRET endpoints from here):

```sql
UPDATE "Representative" SET "currentTerm" = false, "updatedAt" = NOW()
WHERE "bioguideId" IN ('S001157','G000594','S001193','C001127');
```
- `S001157` David Scott (GA-13) — died Apr 22, 2026
- `G000594` Tony Gonzales (TX-23) — resigned Apr 14, 2026
- `S001193` Eric Swalwell (CA-14) — resigned Apr 14, 2026
- `C001127` Cherfilus-McCormick (FL-20) — resigned Apr 21, 2026

After the fix, all 50 states matched their 2020-apportionment seat counts.

### B. Root-cause fix — `sync-representatives` was append-only
The sync **upserted** members from the API but **never retired** anyone who dropped off it, so deaths/resignations lingered as `currentTerm=true` forever (the cause of §A). `app/api/sync-representatives/route.ts`:
- Track every `bioguideId` seen this run (`seenBioguideIds`).
- After the loop, `updateMany({ where: { currentTerm: true, bioguideId: { notIn: seenBioguideIds } }, data: { currentTerm: false } })`.
- **Safety guard `MIN_EXPECTED_MEMBERS = 400`:** only run the retire step if we saw a plausible full roster — a partial/garbled upstream response (or `notIn: []`, which matches every row) must never wipe the roster. Returns `retireSkipped: true` when the guard trips.
- Added `export const maxDuration = 300`.

### C. High-effort code review (`/code-review --effort high`) — 10 bugs fixed

1. **Auth bypass on every sync/cron route (the big one).** Each route had an inline `checkAuth` that compared `Bearer ${process.env.CRON_SECRET}` — when `CRON_SECRET` is unset, `Bearer undefined === Bearer undefined`, leaving every sync endpoint **publicly callable**. Centralized into **`lib/auth/syncAuth.ts` → `checkSyncAuth(req, opts)`**, which **returns `false` when `CRON_SECRET` is unset**, and accepts `Authorization: Bearer`, `x-sync-secret`, or (opt-in) the unforgeable `x-vercel-cron` header. **Migrated all 11 sync/cron routes** to it (incl. `sync-news`, which had shipped after the original sweep with the vulnerable pattern).
2. **`lib/api/lda.ts` over-counted lobbying firms.** `getLobbyingFirmCount` used the raw pagination `count`, which counts every LD-2 filing — one firm filing several disclosures inflated the number. Refactored to a shared `fetchDedupedFilings()` that de-dupes by `registrant|client`; the count is now distinct firm+client pairs.
3. **`lib/api/fec.ts` `Math.max(...[])` → `-Infinity`.** An empty `cycles` array is truthy, so `|| fallback` never fired and the committee cycle came back `-Infinity`. Guarded: `Math.max(...(r.cycles?.length ? r.cycles : [currentFECCycle()]))`.
4. **Dashboard "rep mismatches this week" was wrong.** It was derived by filtering a truncated 15-item activity feed with no date filter. Extracted `GamificationService.computeRepMismatches()` (with per-bill dedup) and added `getRepMismatchCount(userId, state, sinceDays=7)` — a proper 7-day bounded query run in the dashboard's `Promise.all`.
5. **`VotingPanel` double-counted on re-vote (stale closure).** `currentVote?.position` is the initial server prop, never updated after a submit, so changing your vote subtracted the wrong prior tally and mis-fired confetti. Now tracked in `lastSubmittedPosition` state, updated after each successful submit.
6–10. Supporting fixes folded into the above: `sync-lobbying` leading-delay loop (no trailing delay on the last bill) + `maxDuration=300`; removed a redundant `prisma.vote.count` on the dashboard (uses `profile.stats.totalVotes`); dashboard `Promise.all` conflict resolution keeping both `popularAggregate` and `repMismatchCount`; local `CRON_SECRET` consts removed alongside the auth migration.

---

## 2. ⛳ DO THESE FIRST (next session, in order)

1. **Decide on `landing-broadsheet`.** It's a clean 1-commit feature branch with a live preview (the ZIP→your-reps hero). Either merge to `main` or iterate. This is the only open work-in-progress branch.
2. **🔴 Clerk secret-key rotation (still overdue).** A `sk_live_…` was exposed in chat in an earlier session. Clerk → API Keys → roll → update `CLERK_SECRET_KEY` in Vercel → redeploy → verify sign-in. **Dashboard-only, not codeable.** Carried across multiple passdowns — please just do it.
3. **Run `sync-representatives` once to confirm the auto-retire path** behaves in production (watch for `retireSkipped` in the response — if it's ever `true`, the API returned a short roster and nothing was retired, which is the safe outcome).

> Note: the prior RESUME's "PUSH 2 unpushed local commits (`2af2735` trademark)" item is **DONE** — trademark notices landed on `main` as `4626d5f`. No longer outstanding.

---

## 3. Known risks NOT fixed (carried over, still open)

1. **`/elections`** — there's now a static fallback calendar (`lib/data/upcoming-elections.ts`, commit `f1ce88e`) so the page reads complete with zero API, but live data still depends on the **retired Google Civic API**. Fine for launch; revisit if you want live election data.
2. **Lobbying firm-count badge (TrustBar) stays 0/hidden.** `sync-lobbying` iterates *all* bills with rate-limited LDA calls — impractical for a 10-min workflow job, so it's **not scheduled**. The bill-page panel works live (no sync needed); only the cached count badge is stale. No false data shown. Re-architect (sync only active bills, paginated) if the badge matters.
3. **`OPEN_FEC_API_KEY` not set in Vercel.** FEC IDs are populated and the code path is verified, but "Who funds the sponsors?" donor figures gate on the real key (not the rate-limited DEMO_KEY). Free key at https://api.open.fec.gov/developers/. Until then the panel shows an "Add OPEN_FEC_API_KEY" empty state.

---

## 4. Gotchas / learnings

- **The daily GitHub Actions workflow calls each sync endpoint DIRECTLY** (not the `/api/cron/sync` orchestrator). When you add a sync, add it to `.github/workflows/sync-bills.yml` too — the orchestrator route is mostly a manual/convenience path. (Two Vercel crons were removed earlier for 504ing; only the weekly digest cron remains in `vercel.json`.)
- **`/api/cron/sync` must target the `www` host** — the apex 301-redirects to `www` and `fetch()` strips the `Authorization` header across that hop. It uses `NEXT_PUBLIC_APP_URL || https://www.democracyunlocked.com`.
- **Sync routes now share one auth gate.** Any new sync route should `import { checkSyncAuth } from '@/lib/auth/syncAuth'` rather than re-rolling an inline check — the inline pattern is exactly what caused the bypass.
- **Append-only syncs need a retire step.** The roster bug was structural, not a one-off bad record. If any other table mirrors an upstream "current" set (committees, etc.), check it has the same `notIn(seen)` retire-with-guard pattern.
- **Manual sync:** `/sync-admin` → enter `CRON_SECRET` (field clears on reload!) → trigger.
