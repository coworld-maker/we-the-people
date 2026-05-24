# Current Status

Live snapshot of where the project is. Update this when meaningful state changes — new deploy, new env vars, data refresh, blocked work resolved.

> Last updated: **2026-05-24** by Claude (AI assistant pair-coding session)

---

## Production

- **URL**: https://www.democracyunlocked.com
- **Branch**: `main` (auto-deploys to production via Vercel on every push)
- **Repo**: https://github.com/coworld-maker/we-the-people
- **Latest deploy**: see [Vercel dashboard](https://vercel.com/htn-holdings/democracyunlocked)

## Tech stack

| Layer | Stack |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind 3 + CSS variables (patriotic palette) |
| Auth | Clerk |
| DB | Supabase Postgres + Prisma 7 |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5`) |
| Maps | `d3-geo` + `topojson-client` + `us-atlas` (CDN) |
| Hosting | Vercel |
| Email | (not yet wired — Resend is the recommendation) |

## Data state (as of 2026-05-24)

| Table | Count | Notes |
|---|---|---|
| `Bill` | 1,582 | 1,581 categorized; 5 AI-analyzed (lazy on view); 0 with full text (lazy) |
| `Representative` | 538 (all `currentTerm`) | Full names stored (e.g., "California"), not 2-letter codes — normalize via `lib/utils/state-codes.ts` |
| `CongressVote` | ~20,911 | Last roll-call: 2026-04-20 (stale by ~5 weeks) |
| `Vote` (citizen) | grows organically | |
| `Discussion` | grows organically | |
| `User` | grows organically | `state` field populated when user picks state on either map |

**Sync staleness**: Bills last synced **2026-04-06**, congressional votes last synced **2026-04-20**. Consider setting up Vercel Cron to auto-sync daily — see [`RUNBOOK.md`](./RUNBOOK.md).

## Required environment variables

These need to be set in Vercel project settings + locally in `.env.local`:

| Variable | Purpose | Required? |
|---|---|---|
| `DATABASE_URL` | Supabase connection string | ✅ |
| `CLERK_PUBLISHABLE_KEY` | Clerk auth | ✅ |
| `CLERK_SECRET_KEY` | Clerk server-side | ✅ |
| `CONGRESS_API_KEY` | Congress.gov API (free, register at api.data.gov) | ✅ |
| `ANTHROPIC_API_KEY` | Claude API | ✅ (for AI features) |
| `CRON_SECRET` | Authorizes sync endpoints | ✅ |
| `OPENSTATES_API_KEY` | State legislature integration | ⬜ Optional |
| `NEXT_PUBLIC_FEEDBACK_URL` | Microsoft Form / Tally URL for community poll | ⬜ Optional |

## ⚠️ Action items before public/EU launch

1. **Drop the brand logo** at `public/logo.png` then run `python3 scripts/prepare-logo.py` and commit the 6 generated files. Without this, the site uses an SVG fallback (functional but monochrome).
2. **Privacy policy review by counsel.** Especially the special-category-data sections (votes = political opinions under GDPR Art. 9). See [`DEVLOG.md`](./DEVLOG.md) entry for 2026-05-24 privacy compliance.
3. **Replace placeholders** in `app/(legal)/privacy/page.tsx` (postal address, EU representative).
4. **Set up `privacy@` and `legal@` mailboxes** — both legal docs reference them.
5. **Sign DPAs** with Clerk, Supabase, Vercel, Anthropic, email provider.
6. **Run a fresh sync** — bills + congressional votes are ~5 weeks behind.

## What's actively in progress

Nothing right now. Last session ended after privacy compliance commit. The team is free to pick up any of:

## What's planned but not started

- **Vercel Cron auto-sync** — daily bill + congress-vote refresh. Code is in place (`/api/sync-bills`, `/api/sync-congress-votes`); just need a `vercel.json` with the cron config. See [`RUNBOOK.md`](./RUNBOOK.md).
- **Notifications model** — `Notification` table exists; UI + delivery (email via Resend) not wired up. Triggers: tracked bill moved, weekly digest of rep activity.
- **State-by-state cron** in Resend for the weekly digest, once notifications are wired.
- **Monetization Phase 1** — GitHub Sponsors + Ko-fi donor links. ~1 hour of work, no code changes beyond a footer link.

## Known issues / debt

- **State `Representative` records use full state names** (e.g., "California") while everything else uses 2-letter codes. Helpers in `lib/utils/state-codes.ts` bridge this. Long-term: backfill a 2-letter `state` column on `Representative` and use it directly.
- **`bills/[id]` "Generate analysis" buttons can still appear** if `IntersectionObserver` doesn't fire fast enough — minor edge case, mostly handled by the `triggeredRef` guard.
- **Migrations applied via Supabase MCP not Prisma history.** `prisma/migrations/` has folders for `add_user_state` and `add_bill_state_impacts` but the prod `_prisma_migrations` table doesn't know about them. If running `prisma migrate deploy` locally against prod, use `prisma migrate resolve --applied …` first.

## Useful links

- Vercel project: https://vercel.com/htn-holdings/democracyunlocked
- Supabase project: https://supabase.com/dashboard/project/hiypdaqcpssqlwtgprmf
- Anthropic console: https://console.anthropic.com
- Clerk dashboard: https://dashboard.clerk.com
- Congress.gov API docs: https://api.congress.gov
