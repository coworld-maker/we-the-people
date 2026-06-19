# Passdown — Mobile fixes, lobbying, rep tiles, and the empty rep data

**Project:** Democracy Unlocked™ (democracyunlocked.com)
**Date:** June 19, 2026
**Repo:** `~/Documents/GitHub/we-the-people` (public, AGPL). Deploys to Vercel on push to `main`.
**Prior passdown:** [2026-06-18-news-community-consolidation.md](./2026-06-18-news-community-consolidation.md) · **Start-here:** [RESUME.md](./RESUME.md)

> No local Node → Vercel build is the typechecker; GitHub Actions `test.yml` runs unit tests.
> Verify deploys via the Vercel MCP; DB work via the Supabase MCP.

---

## 1. What shipped this session

### Mobile (the "doesn't feel connected" report)
- **Mobile section sub-nav** (`components/ui/MobileSectionNav.tsx`): the bottom tab bar (Home/Track/Know/Act) left section *sub-pages* (Scorecards, News, State Bills, Policy Areas, Documents) with **no mobile entry point** after the hamburger was retired. New contextual chip row under the header shows the current section's siblings. **This was the root cause of "what happened to scorecards on mobile."**
- **Horizontal overflow fixed** (`bills/[id]/page.tsx`): the bill page rendered 731px wide on a 600px screen because `BillTimeline`'s `min-w-[640px]` couldn't be contained — grid columns had `min-width:auto`. Added `min-w-0` to both grid columns. Verified `scrollWidth == viewport` across 6 pages. (This was the "artifacts different sizes when zoomed out" bug.)
- **Bill-page mobile order**: restructured into 3 grid regions so mobile reads **vote → bill content → secondary cards** (was: whole sidebar incl. lobbying/news *before* the summary). Desktop two-column layout preserved via `lg:col-start-3` / `lg:row-span-2`.

### Lobbying (LDA) — was fully broken
- Root cause: sync queried `filing_type=LD2` which the LDA API **rejects** ("not a valid choice") → every request errored → **0 firms on all 837 synced bills**. Also `issue_bill_number` was ignored (returned the whole DB).
- Rewrote `lib/api/lda.ts`: correct written-form query (`H.R. 4405`, `S. 1863`), **bounded exact-match regex** on each filing's activity text so `H.R. 1` can't match `H.R. 1000` (was 31,379 false hits → 8 real firms), dedupe by registrant+client, recent-year bias, match-centered snippet, `ldaVerifyUrl()`.
- `LobbyingPanel`: shows real firms live (per-render, cached 24h), verify-on-LDA link always shown, **honest caveat** ("firms whose filings listed this bill … not necessarily active/paid lobbying on this bill alone" — one LDA filing covers many bills).
- Verified: Epstein bill → NRF, NAACP, Church of Scientology.

### Rep tiles — connect to buried info
- **Bill-page sponsor tiles** now link to the sponsor's scorecard (were dead-end divs; sponsors carry `bioguideId`).
- **DelegationCard** (state pages) surfaces buried info **inline**: committees when present, else "N votes tracked · see scorecard →" (states API now computes per-rep vote counts via `groupBy`).

### Zip lookup on state pages
- `components/states/StateDistrictFinder.tsx`: enter a zip on `/states/[code]` to pinpoint your specific House member in that delegation (or redirect to the right state). Secondary entry point outside the dashboard.

### The empty rep data (committees + FEC) — fixed + backfilled
- **FEC IDs were empty** because the source URL (`raw.githubusercontent.com/.../main/legislators-current.json`) **404s** — the repo now publishes JSON via **GitHub Pages** (`unitedstates.github.io/congress-legislators/...`). Fixed the URL in `sync-fec-ids`.
- **Committees were never synced.** New `app/api/sync-committees/route.ts` pulls `committee-membership-current.json` + `committees-current.json` (GitHub Pages), rolls subcommittees up to parent names, writes `Representative.committees`.
- **Both syncs were missing from the daily workflow** — added `sync-fec-ids` and `sync-committees` jobs to `.github/workflows/sync-bills.yml` (+ middleware allowlist for sync-committees).
- **Backfilled the DB directly via Supabase MCP** (can't trigger CRON_SECRET endpoints): **FEC 536/537, committees 528/537**. The ~9 gaps are non-voting delegates / newly-seated members not yet in the source file.

---

## 2. Broken-code sweep results (this session)

| Area | Status |
|---|---|
| FEC source URL (404) | ✅ fixed |
| Lobbying `filing_type=LD2` (invalid) | ✅ fixed; no lingering refs |
| Committees (never populated) | ✅ synced + backfilled |
| 14 RSS feeds | ✅ all return 200 |
| Daily workflow coverage | ✅ now: bills, reps, votes, news, fec-ids, committees |
| `raw.githubusercontent` dead-URL pattern | ✅ none left (only a comment) |

### ⚠️ Known risks NOT fixed (documented for follow-up)
1. **Elections page may be silently empty.** `lib/services/civicService.ts` calls the **Google Civic Information API** (`googleapis.com/civicinfo/v2/elections`), which Google has largely retired, and needs `GOOGLE_CIVIC_API_KEY` (likely unset/invalid — same key family that broke the old district lookup). It **degrades gracefully to `[]`** (no crash), but `/elections` likely shows nothing. Used by `app/api/elections/route.ts` + `/elections/page.tsx`. Needs a replacement data source (or confirm the key/endpoint still work).
2. **Lobbying firm-count badge (TrustBar) stays 0/hidden.** `sync-lobbying` iterates *all* bills with rate-limited LDA calls — impractical for a 10-min workflow job, so it's **not scheduled**. The bill-page panel works live (no sync needed); only the cached count badge is stale. No false data shown. Re-architect if the badge matters (e.g., sync only active bills, paginated).
3. `sync-senator-lis-ids`, `sync-voted-bills` exist but aren't in the daily workflow — appear to be one-time/manual utilities; not flagged as broken.

---

## 3. Outstanding (carried over)
- **🔴 Clerk secret-key rotation** — still pending from earlier sessions (a `sk_live_…` was exposed in chat). Dashboard-only: Clerk → API Keys → roll → update `CLERK_SECRET_KEY` in Vercel → redeploy → verify sign-in.
- Optional: Trademarks clause in Terms of Service (offered, not drafted).
- Optional: set `OPEN_FEC_API_KEY` in Vercel — FEC IDs are now populated, but the LobbyingPanel "Who funds the sponsors?" donor figures need this key to render (without it, shows "Add OPEN_FEC_API_KEY to enable donor data").

---

## 4. Gotchas / learnings
- **External data sources move.** Two silent breakages this session were dead/changed endpoints (FEC raw→Pages; LDA invalid filing_type). The new RSS feed-health logging + this sweep pattern (grep external URLs, curl status) catch these.
- **LDA attribution is fuzzy** — one filing lists many bills; we exact-match the bill code and caveat heavily. Don't present it as precise paid-lobbying.
- **Direct DB backfill via Supabase MCP** is the way to populate when you can't trigger CRON_SECRET endpoints: generate batched `UPDATE … FROM (VALUES …)` SQL and run via `execute_sql`.
- Bill-page LDA + news read with `revalidate: 86400` (24h) — code changes show immediately on fresh render, but cached snippets refresh within a day.
