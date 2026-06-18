# ▶ RESUME HERE — fast bootstrap for the next session

_Last updated: 2026-06-18. This is the "start here" file. For full detail see
[2026-06-18-news-community-consolidation.md](./2026-06-18-news-community-consolidation.md)._

## 30-second context
Democracy Unlocked™ — civic app, Next.js 15 on Vercel, public repo (AGPL), Supabase/Prisma, Clerk auth.
No local Node → Vercel build = typechecker; GitHub Actions `test.yml` = unit tests.
Strategic moat: **community + accountability** (citizen voting, discussions, money-in-politics), not AI summaries.

## ⛳ DO THESE FIRST (in order)
1. **PUSH** — 2 commits are committed locally but unpushed (GitHub keychain auth died mid-session):
   - `2af2735` trademark notices
   - the passdown + this RESUME doc
   ```bash
   cd ~/Documents/GitHub/we-the-people
   git push origin main          # re-auth first if needed: gh auth login
   ```
   Then confirm Vercel auto-deploy goes READY.
2. **Clerk key rotation (overdue security)** — `sk_live_…` was exposed in chat. Clerk → API Keys → roll; update `CLERK_SECRET_KEY` in Vercel; redeploy; verify sign-in. (Dashboard action — not codeable.)

## State of play (all live unless noted)
- **News:** curated RSS (primary) + Newsdata (backup) → `/api/sync-news` → `BillNewsArticle` → `/news` (PressFeed, lean filter), dashboard teaser, bill cards. Daily cron job added. Verified: balanced L15/C10/R15.
- **Community:** usernames + moderation (`/moderation`), share-your-vote card, discussions. **Live chat removed** (redundant).
- **Consolidation done:** retired `/voting-records`→`/scorecards`, removed `WelcomeGuide`, removed duplicate vote-stats card.
- **Hardening done:** lean-label methodology owned; feed-health logging; **first unit tests + CI (green)**; `/news` section divider.

## Council open list (next candidates)
1. ~~Lean methodology~~ ✅ 2. **Clerk rotation** (above) 3. ~~Feed-health~~ ✅ 4. ~~Tests~~ ✅ 5. ~~/news identity~~ ✅
→ Net remaining: **Clerk rotation**, then optional **Terms ToS trademark clause** (offered, not yet drafted).

## Operate the news feed
- Manual: `/sync-admin` → enter `CRON_SECRET` (field clears on reload!) → "Sync Press Coverage".
- Auto: daily via `.github/workflows/sync-bills.yml` `sync-news` job.

## Don't relearn these
- GDELT live API 429s from Vercel IPs (→504); NewsAPI.org free = localhost-only; Newsdata free = aggregator-heavy (backup only).
- Daily GH workflow calls sync endpoints DIRECTLY (not the orchestrator) — add new syncs there too.
