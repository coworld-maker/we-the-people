# Passdown — Data-correctness sweep (the "wrong data, no errors" class)

**Project:** Democracy Unlocked™ (democracyunlocked.com)
**Date:** August 24, 2026
**Repo:** `~/Documents/GitHub/we-the-people` (public, AGPL). Deploys to Vercel on push to `main`.
**Prior passdown:** [2026-06-29-summaries-crons-links-launchprep.md](./2026-06-29-summaries-crons-links-launchprep.md) · **Start-here:** [RESUME.md](./RESUME.md)

> No local Node → the Vercel build is the typechecker. DB via Supabase MCP (project `hiypdaqcpssqlwtgprmf`).

---

## 0. TL;DR

Every bug this session was the same species: **code that runs clean while displaying wrong data.** No crashes, no error logs — which is why they survived previous "is anything broken?" sweeps that only looked for failures.

**The root pattern: joining on an identifier that isn't unique.** Bill numbers restart every Congress; `chamber` is stored capitalized. Any lookup that ignores those facts silently matches the wrong row.

**Site status: working.** All fixes deployed and verified on live pages.

---

## 1. What was broken and what shipped

### 1.1 Lobbying showed other bills' lobbyists 🔴 (`bac7e1e`)
Bill numbers restart each Congress, and the LDA query matched only the *number* — never the years. Bill pages attributed unrelated lobbying to current bills.

- **Symptom:** H.R. 6644 (a 2025 housing bill) listed Cigna, Blue Cross, and the AMA as lobbyists.
- **Cause:** those were filings for a *different* H.R. 6644 — 2012's Global Partnerships Act and a 2020 bill explicitly labeled "116th Congress."
- **Fix:** `congressYears(congress)` maps a Congress to its two calendar years; every LDA query is scoped with the API's `filing_year` filter.
- **Verified live:** H.R. 6644 now renders Holland & Knight / Meridian River Dev Corp, with the filing text confirming *"H.R. 6644 - Housing for the 21st Century Act."*

> ⚠️ **Correction to an earlier claim.** I initially reported "all 18 firms were false — zero real lobbying." That was wrong. I sampled the unfiltered result set (whose `ordering=-filing_year` did **not** return newest-first) and generalized. H.R. 6644 actually has **37 real 2025–26 filings** from housing-sector orgs. The bug was real — the stored count of 18 was wrong — but the bill was never lobbying-free.

### 1.2 The sync then overwrote verified counts with zeros 🔴 (`1f36fdd`)
Fixing 1.1 introduced this, and it was caught in review before the second push.

- **Cause A:** `getLobbyingFirmCount` returned `filings?.length ?? 0`, so a *failed* lookup was indistinguishable from "no lobbying" and got persisted as `0`. HR 3633 (32 real firms) and S 1838 (13) were zeroed.
- **Cause B:** the Congress fix doubled requests per bill (two years) while `DELAY_MS` still assumed one → ~144 req/min, past LDA's limit → mass rate-limiting.
- **Fix:** `fetchExactFilings` returns `null` if **any** year fails; `getLobbyingFirmCount`/`getLobbyingForBill` return `number | null` / `LDAFiling[] | null`; the sync **skips the write** on `null` and reports a `skipped` count.
- **Also fixed the same bug on the live page:** `LobbyingPanel` now distinguishes *"Couldn't load lobbying disclosures right now"* from *"No lobbying disclosures matched this bill"*. Previously any transient failure told users a bill had **no** lobbyists — as fact.
- All zeros from the bad run were `NULL`ed (never verified).

### 1.3 Every senator was labeled "Rep." 🔴 (`0e79431`)
`Representative.chamber` is stored capitalized (`'Senate'`), but `RepVotesOnBill` compared `=== 'senate'`, so the check always failed and fell through to "Rep." The same lowercase compare blanked the title in `LobbyingPanel`.

### 1.4 63 bills had inverted chamber logic 🔴 (`0e79431`)
`Bill.originChamber` had **two writers with two conventions** — `sync-bills` wrote `'House'`, `billService` wrote `'house'`. `BillTimeline` checks `=== 'House'`, so lowercase rows took the wrong branch: a House bill was told *"the Senate Majority Leader schedules a floor vote."* Normalizer now returns capitalized; the 63 rows were backfilled.

### 1.5 The per-bill news card was dead on every page 🟠 (`0e79431`, `d8ec6e7`)
0 of 1,479 articles linked to any bill.

- **Cause A:** the code map keyed on `billType+billNumber` with no congress; **20 numbers are reused** across the 118th/119th, so entries silently collided. Now newest-Congress-wins.
- **Cause B (the real one):** only **3 of 1,479** articles contain a bill code at all — journalists write *"the Epstein Files Transparency Act,"* not *"H.R. 4405."* Added full-phrase title matching, verified against stored articles (Epstein Files Transparency Act → HR 4405, AI Kill Switch Act → HR 9917, Foreign Funding Transparency Act → HR 9772).
- **Note:** `Bill.shortTitle` is **NULL on all rows** — `title` is what carries the popular act name. My first attempt matched on `shortTitle` and would have silently done nothing.

### 1.6 sync-lobbying could never finish 🟠 (`5002630`, `117362a`)
It looped over all ~4,400 bills with no cursor and no time budget: ~5 hours of work against a 300s `maxDuration`, so every run died mid-way and restarted at the same first ~70 bills. That's why it was never scheduled — and why nobody noticed the counts were wrong.

- `limit`/`offset` cursor + `nextOffset`, a 240s wall-clock budget, ceremonial resolutions skipped.
- Targets only bills **never successfully checked** (`lobbyingFirmCount IS NULL`) so skipped lookups don't cause the same bills to be retried forever.
- `DELAY_MS` → 2200ms (~55 req/min). Measured: 1100ms still got ~65% rate-limited.
- Added to the daily workflow with a `lobbying_offset` dispatch input.

### 1.7 Silent write failures (earlier in session, `6f17776`)
`FollowButton` swallowed errors (click → nothing happens); `DiscussionBoard` showed "Reported" even on a 500. Both now surface failure.

---

## 2. Current state (measured 2026-08-24)

| Metric | Value |
|---|---|
| Bills | 4,397 |
| Structured (TL;DR) summaries | 1,944 |
| Lobbying counts checked | 93 (13 with lobbying, 80 confirmed none) |
| Lobbying backlog remaining | 3,726 — drains nightly |
| News articles | 1,481 |
| Current members | 537 (437 House / 100 Senate) |

---

## 3. 🔴 Known broken — needs the owner, not code

**AI analysis has been down since Aug 5** (19 days). The Anthropic API returns:

> `Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.`

Not a code bug. Fix at **console.anthropic.com → Plans & Billing** (set auto-reload so the 2am cron doesn't die silently). Cost reference: Haiku 4.5 is $1/$5 per MTok ≈ **$0.01/bill**; the nightly pre-warm ≈ $0.60/night.

> **Unfixed follow-up:** while credits are exhausted, the raw provider error is surfaced to end users by `AISummary` (it renders `data.details`). Worth sanitizing so visitors never see billing messages — not done this session.

---

## 4. Other open items

- **178 orphaned `CongressVote` rows** (8 bioguideIds) — departed members; modest scorecard gaps, no wrong data shown.
- **No analytics events since Aug 15.**
- **`Bill.shortTitle` never synced** — bill pages show long formal titles everywhere (`shortTitle || title`). Fixing the sync to populate it would improve readability *and* news matching.
- Some bills carry **future `latestActionDate`** values (NDAA showed 2026-07-22). Probably scheduled actions; don't build "just passed" claims on those dates.

---

## 5. Learnings

1. **"No errors" ≠ "correct."** Every bug here logged nothing. Health checks that only look for failures will not find this class.
2. **Never let a failed lookup become a value.** Return `null` and make callers handle it — `?? 0` turned an outage into permanent bad data.
3. **A partial result is worse than no result** once stored: it's indistinguishable from a real drop.
4. **Verify a fix has an effect before shipping it** — the `shortTitle` matcher would have been a silent no-op.
5. **Check the whole call graph on a type change.** Tightening the failure semantics fixed the sync but regressed the live page, because a second caller coalesced `null` to `[]`.
6. **Bill numbers are not unique.** Any lookup keyed on `billType+billNumber` needs `congress`.
