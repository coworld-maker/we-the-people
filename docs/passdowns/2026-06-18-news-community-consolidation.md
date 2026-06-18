# Passdown — News system, community features, consolidation & hardening

**Project:** Democracy Unlocked™ (democracyunlocked.com)
**Date:** June 18, 2026
**Repo:** `~/Documents/GitHub/we-the-people` (public, AGPL-3.0). Deploys to Vercel on push to `main`.
**Prior passdown:** [2026-06-12-nav-overhaul.md](./2026-06-12-nav-overhaul.md)

> No local Node in the working environment — the **Vercel build is the type-checker**
> and the **GitHub Actions `test.yml`** runs the unit tests. Verify via the Vercel
> MCP (deployment state) and the GitHub Actions API.

---

## 1. Strategic context (why this session happened)

A competitive scan ([competitive-analysis-2026-06.md](../competitive-analysis-2026-06.md))
found the "AI summary + rep votes + contact" feature set is now **table stakes**
(CivicAlign, BillBoard, How Congress Votes, Better Congress). The moat is
**community + accountability** — citizen voting, discussions, and money-in-politics
data the clones lack. Everything below was built/cut against that thesis.

Roadmap of record: [roadmap-2026-06.md](../roadmap-2026-06.md).

---

## 2. Decisions of record (this session)

| Decision | Rationale |
|---|---|
| Council additions: social share, usernames+moderation, news — **build**; live chat — **build then removed** | All on-moat; chat proved redundant with discussions |
| Share to social = **outbound prefilled only**, never auto-post | Avoids OAuth/standing-permission liability |
| **Live chat removed**, discussion board kept | Async/attributable/SEO/lower-moderation-risk; chat had cold-start + polling cost + double moderation surface |
| News input = **curated balanced RSS** (primary) + **Newsdata** (backup) | Search APIs were sparse/rate-limited; RSS is free, reliable, balanced **by construction** |
| News is **trusted-outlets-only**, lean-labeled | Credibility > volume for a nonpartisan platform |
| Lean labels: **own the methodology** ("our assessment"), dropped "AllSides-style" | Was borrowing AllSides' authority without their data |
| Retire `/voting-records` (→ `/scorecards`) and the `WelcomeGuide` modal | Redundant with scorecard Voting tab / `/get-started` |
| Remove duplicate "Public opinion" vote-stats card on bill pages | Rendered twice (VotingPanel + standalone card) |

---

## 3. What shipped

### Community features
- **Share-your-vote card** (`components/ui/SocialShare.tsx`) — X/Bluesky/Facebook/Threads/copy, prefilled intents, in the post-vote panel.
- **Usernames + moderation** — `User.username/isModerator/isBanned`, `ContentReport` model; `lib/username.ts` (validation + anti-impersonation); `/api/user/username`, `/api/reports` (file/queue/dismiss); `/moderation` queue page (reachable via a moderator-only card on the Act hub); `lib/admin.ts` `isModerator()`. **Council hard gate:** no UGC ships without report+block+escalation — satisfied.
- **Live chat — REMOVED.** `ChatMessage` table left dormant (deprecated in schema; no code refs).

### News system (the big one)
- **Input:** `lib/api/rss.ts` — 14 curated balanced feeds (center/left/right), minimal RSS+Atom parser (`parseRssDocument`, exported + unit-tested), congressional-relevance filter, per-feed failure tolerance + **health logging**. Backup: `getNewsdataCongressional()` in `lib/api/news.ts` (trusted-only).
- **Architecture: sync-once-read-many.** `/api/sync-news` (CRON_SECRET-gated, `maxDuration 60`) ingests RSS + Newsdata, dedupes by URL (RSS wins), stores in `BillNewsArticle` (**`billId` nullable** = general congressional coverage; set when an article cites a bill code via `lib/news-match.ts` `billCodeKeys` → DB map), prunes >30d. Pages read the DB, never hit feeds live.
- **Surfaces:** `/news` lead section `PressFeed` (lean filter All/Left/Center/Right, links out + back to bill); dashboard `NewsTeaser`; bill-page `BillNews` card (only bill-linked, links to full feed).
- **Daily refresh:** `sync-news` job added to `.github/workflows/sync-bills.yml` (it was missing — news would have gone stale).
- **Verified live:** 81 RSS + 2 Newsdata = 83 stored, balanced Left 15 / Center 10 / Right 15, filters work.

### Consolidation & connectivity
- Retired `/voting-records` (redirect → `/scorecards`); "Know" nav = My Reps / Scorecards / News.
- Retired `WelcomeGuide` modal (`/get-started` is the single app-help source; GuideBanner + newcomer 3-step card are funnels; `/learn` kept).
- Removed duplicate "Public opinion" card on bill pages.
- Connectivity: dashboard rep cards → scorecards; scorecard vote rows → bills; news cross-linked (teaser → /news → bill; bill card → /news); Track/Know nav labels are clickable links to their hubs.

### Hardening (council items)
- **#1** lean methodology (above)
- **#3** feed-health logging (per-dead-feed warn, <½-healthy error, low-yield error)
- **#4** **first automated tests in the repo** — `vitest` + `__tests__/` (bill-code matcher, RSS/Atom parser, CDATA/entity decode); `.github/workflows/test.yml` runs on push/PR (green). `tsconfig` excludes tests from the Next build.
- **#5** `/news` "On Democracy Unlocked" divider separating press from platform activity.

### Earlier-in-session (already covered in nav passdown but shipped here too)
- Instrumentation (`AnalyticsEvent` + `/api/track`), Get Started promoted to nav, teaching empty states, district lookup = static dataset, trademark notices.

---

## 4. Trademarks (this session, end)
- **™** added to wordmark (dashboard nav, landing hero, both footers); footer/landing copyright state name+logo are trademarks; README has a **Trademarks** section (AGPL = code only, forks must rebrand).
- Used **™** (common-law) — **not ®** (USPTO-registered only; ® without registration = false marking).

---

## 5. OPEN / ACTION ITEMS (start here next session)

1. **🔴 PUSH PENDING:** commit `2af2735` (trademark notices) is **committed locally but NOT pushed** — GitHub keychain auth failed mid-session ("could not read Username"). Run `git push origin main` (re-auth via `gh auth login` or refresh PAT). Vercel auto-deploys after.
2. **🔴 SECURITY — Clerk key rotation (overdue, multi-session):** the `sk_live_…` secret was exposed in chat long ago. Roll it in Clerk → API Keys, update `CLERK_SECRET_KEY` in Vercel, redeploy. Dashboard action — not codeable.
3. **Optional:** Trademarks clause in Terms of Service (legal copy — left for deliberate review; offered to draft).
4. **Watch:** if `sync-news` `articlesFetched` drops sharply, a feed URL changed — check `lib/api/rss.ts FEEDS` (health logs will flag it).
5. **Unused but kept:** `NEWSDATA_API_KEY` (now the news backup); GDELT path in `news.ts` (abandoned — 429s from Vercel IPs); `ChatMessage` table (dormant).

---

## 6. Gotchas / learnings (save the next session time)
- **GDELT DOC API 429s** at 1 req/5s from Vercel's shared IPs → caused 504 timeouts. Don't use it live. (Full GDELT is on BigQuery if ever needed — no rate limit.)
- **NewsAPI.org** free tier is localhost-only + non-commercial — useless in prod.
- **Newsdata free tier** is aggregator/tabloid-heavy → ~1 trusted source/bill. Fine as backup, not primary.
- Two build-break type errors this session were caught only by Vercel (`balance()` generic; a stale cast) — the new test suite + CI is the response.
- `/sync-admin` CRON_SECRET field is React state → **clears on reload**; re-enter it before clicking a sync (an empty field returns `{"error":"Unauthorized"}`).
- The daily GH Actions workflow calls sync endpoints **directly** (not `/api/cron/sync`) — add new syncs there too, not just the orchestrator.

---

## 7. How to operate the news feed
- **Manual sync:** `/sync-admin` → enter `CRON_SECRET` → "Sync Press Coverage". Returns `{ fromRss, fromNewsdata, stored, linkedToBills }`.
- **Automatic:** daily via `.github/workflows/sync-bills.yml` `sync-news` job (2 AM UTC).
- **Healthy run:** dozens of articles, balanced lean spread. Low/empty = feed failure (check logs / `rss.ts FEEDS`).
