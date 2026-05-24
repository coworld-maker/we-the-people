# Architecture

A ~15-minute read for anyone walking into this codebase cold. Pair with [`STATUS.md`](./STATUS.md) for current state and [`DEVLOG.md`](./DEVLOG.md) for recent decisions.

---

## Big picture

Democracy Unlocked is a Next.js 15 app that ingests data from Congress.gov, lets citizens read + vote on bills, generates AI analysis of legislation, and shows how citizens compare to their representatives. Auth via Clerk, DB via Supabase Postgres + Prisma, AI via Anthropic Claude.

```
                              ┌──────────────────────┐
   Congress.gov API ─────────►│   sync endpoints     │
   OpenStates API   ─────────►│   (manual or cron)   │──┐
                              └──────────────────────┘  │
                                                        ▼
   User signs in via Clerk  ─►  Next.js App Router  ─► Supabase Postgres ◄─── Prisma
                                       │                                        ▲
                                       ▼                                        │
                              ┌──────────────────────┐                          │
                              │   AI Service         │──── Anthropic API        │
                              │   (lazy + cached)    │                          │
                              └──────────────────────┘                          │
                                       │                                        │
                                       └─ writes back ──────────────────────────┘
```

---

## Directory layout

```
app/
  (dashboard)/           ← auth-gated routes (logged-in experience)
    layout.tsx           ← top nav + footer + cookie banner
    dashboard/           ← home dashboard
    bills/               ← bills list + detail
      [id]/              ← bill detail page (AI summary, timeline, votes, …)
    states/[code]/       ← per-state page (citizen activity, delegation, AI digest)
    scorecards/          ← rep scorecards + National Party Makeup Map
    my-representatives/  ← user's reps + alignment compare
    account/privacy/     ← privacy controls (export, delete, cookies)
    policy-areas/        ← grid of policy areas, links to /bills?policyArea=...
    learn/               ← civic-education guides
    news/                ← news section
    voting-records/      ← roll-call records
    action-center/       ← (placeholder for civic-action features)
    transparency/        ← about / open-source / data sourcing

  (legal)/               ← unauthenticated legal pages
    layout.tsx
    privacy/             ← Privacy Policy
    terms/               ← Terms of Service

  api/                   ← server-side API routes
    bills/               ← bill queries, AI analysis, state impact
    states/              ← state aggregations, AI digest
    representatives/     ← rep lookup, party makeup
    scorecard/[bioguideId]/  ← scorecard data, alignment
    user/                ← user state, inferred interests
    account/             ← privacy: export, delete
    sync-*               ← Congress.gov + OpenStates ingestion endpoints
    cron/                ← scheduled jobs

  page.tsx               ← landing page (public)
  layout.tsx             ← root layout (Clerk provider, fonts, metadata)
  manifest.ts            ← PWA web app manifest
  globals.css            ← design tokens + global styles

components/
  ui/                    ← primitives (Logo, NavBar, Breadcrumbs, …)
  bills/                 ← AISummary, BillTimeline, ProsConsPanel, ImpactPanel, …
  states/                ← StateAIDigest, PolicyAreaPieChart, DelegationCard, …
  scorecards/            ← ScorecardDetailPage, StateAlignmentCard, …
  representatives/       ← MapAndCompare, USPartyMap, …
  legal/                 ← CookieConsent, PrivacyControlsClient
  dashboard/             ← YourRepresentatives widget, PersonalizedBills, …
  landing/               ← TypewriterHero
  policy-areas/          ← CategorizeUncategorized banner

lib/
  prisma.ts              ← Prisma client + driver-adapter setup
  services/              ← server-side business logic
    aiService.ts         ← Anthropic Claude wrapper + cost optimizations
    billService.ts       ← bill queries + Congress.gov text fetching
    voteService.ts
    userService.ts
    alignmentService.ts
    gamificationService.ts
    openStatesService.ts
  utils/
    state-codes.ts       ← ABBR_TO_NAME / NAME_TO_ABBR — bridge between
                            DB's full-name convention and the rest of the
                            app's 2-letter code convention
    billStages.ts        ← parses Bill.actions into STAGE_ORDER + nextAction
  data/
    policy-areas.ts      ← canonical 32 CRS policy areas
    state-impact-weights.ts  ← deterministic AI-free state-impact mapper
    civic-guides.ts      ← learn-section content

prisma/
  schema.prisma          ← models — single source of truth
  migrations/            ← partial; see STATUS.md note about
                            Supabase-MCP-applied migrations

scripts/
  prepare-logo.py        ← generate logo derivatives + favicon
  check-claude-model.mjs ← verify pinned Claude model is still live
  build-district-geo.py  ← (removed — district view is gone)

docs/
  DEVLOG.md              ← chronological work log
  STATUS.md              ← current snapshot
  ARCHITECTURE.md        ← this file
  RUNBOOK.md             ← ops cheatsheet
  Community-Feature-Poll.docx  ← Microsoft Forms poll content

public/
  logo.png               ← brand logo (must be saved by team)
  logo-mark.png          ← generated icon-only crop
  icon-192.png           ← Android PWA
  icon-512.png           ← Android PWA maskable
  data/                  ← static assets (none currently active)
```

---

## Data flow patterns

### Reading bill data
1. User hits `/bills` or `/bills/[id]`
2. Next.js server component calls `BillService.getBills(...)` or `getBillById(...)`
3. Prisma queries Supabase via driver adapter
4. Server component renders; client components hydrate

### Casting a vote
1. User clicks "Yes/No/Abstain" on a bill page
2. `VotingPanel` (client) → `POST /api/votes` → `VoteService.castVote`
3. Vote saved with `reasoningEncrypted` if reasoning provided (encryption helpers in `lib/`)
4. `BillVoteAggregate` updated (or in some flows: computed on read)
5. Page re-renders with new totals

### Generating AI analysis
1. User opens `/bills/[id]`
2. `AISummary` client component mounts; `IntersectionObserver` waits until visible
3. On intersection: `POST /api/bills/[id]/analyze`
4. `AIService.analyzeAndSaveBill`:
   - Staleness check (`aiAnalyzedAt < 30 days` + `bill.updatedAt <= aiAnalyzedAt` → skip)
   - Skip-summary check (CRS `Bill.summary` ≥ 200 chars → instruct Claude to omit summary, plug CRS one back in)
   - System prompt has `cache_control: ephemeral` for 10% repeat-call savings
   - Saves `aiSummary`, `aiAnalyzedAt`, ProCon rows, Impact rows
5. Client `router.refresh()` re-fetches server data; updates render

### State-impact heatmap
1. `BillImpactMap` mounts on `/bills/[id]`
2. `POST /api/bills/[id]/state-impact` first checks `lib/data/state-impact-weights.ts` for the bill's `policyArea`
3. If covered (10 high-volume areas): write deterministic per-state scores, no AI call
4. Otherwise: AI fallback via `AIService.analyzeStateImpact`
5. Result cached in `Bill.stateImpacts` JSON column

### Syncing from Congress.gov
1. `POST /api/sync-bills` with `x-sync-secret: $CRON_SECRET` header
2. Iterates pages of Congress.gov v3 API, upserts each bill via Prisma
3. `Bill.policyArea` initially `null` for many; `POST /api/bills/refresh-policy-areas` re-fetches details for NULL bills (free)
4. Long-tail uncategorized bills go to `POST /api/bills/categorize-uncategorized` (AI, last resort)

---

## Key cross-cutting concerns

### State-code normalization
`Representative.state` is stored as the **full state name** ("California") for historical reasons. The rest of the app — URLs, GeoJSON properties, frontend maps, `User.state` — uses **2-letter codes** ("CA"). Always use `nameToAbbr()` / `abbrToName()` from `lib/utils/state-codes.ts` when crossing this boundary.

### Encryption at rest for sensitive fields
- `User.emailEncrypted` + `User.emailIv` + `User.emailTag` — email never stored plaintext (Clerk holds the canonical address)
- `User.zipCodeEncrypted` + corresponding IV/Tag — only if user volunteers it
- `Vote.reasoningEncrypted` + IV/Tag — vote reasoning is sensitive (political opinion)
- `AuditLog.ipAddressHash` — one-way hash, never raw IP

Helpers live in `lib/encryption.ts` (TBC — check for exact path).

### AI cost control
Four layers stack on every Claude call (`lib/services/aiService.ts`):
1. Deterministic mappers checked first (state-impact, policy-area categorization)
2. CRS summary skip when present
3. `cache_control: ephemeral` on system prompts
4. 30-day staleness check before re-running on the same record

The result: AI cost is ~$0.03/month at current scale, not $30. See [`DEVLOG.md`](./DEVLOG.md) "AI cost optimization" for the math.

### Prisma migration history mismatch
Two migrations (`add_user_state`, `add_bill_state_impacts`) were applied directly to prod via the Supabase migration system, not through Prisma's `_prisma_migrations` table. The schema.prisma is correct; Prisma client works fine; only `prisma migrate deploy` will be confused if you run it against prod. Use `prisma migrate resolve --applied …` to mark them resolved, or just delete the folders from `prisma/migrations/`.

### Privacy & data rights
Every page has Privacy / Terms / Your data links in the footer. The `/account/privacy` page provides:
- Cookie preferences (functional cookies opt-in)
- Data export (GDPR Art. 20 — `GET /api/account/export`)
- Account deletion (GDPR Art. 17 — `POST /api/account/delete`)

The cookie banner (`<CookieConsent>`) mounts at both the dashboard and landing layouts and shows once per device until decided.

---

## Important data sources

- **Congress.gov API** — bills, members, roll-call votes (free, requires API key)
- **OpenStates API** — state legislatures (free up to 500 req/day)
- **us-atlas TopoJSON** — state geometry, loaded from jsdelivr CDN at runtime
- **Jeffrey Lewis congressional-district-boundaries** — used briefly for district view (removed; data in git history)
- **Public domain stats** — USDA, EIA, BLM, DHS, DoD, Census data inform the deterministic state-impact weights in `lib/data/state-impact-weights.ts`

---

## Auth flow

1. Clerk handles all authentication. We never touch passwords.
2. Sign-up creates a Clerk user + a `User` row in our DB (linked via `clerkId`).
3. Email is stored encrypted in our DB; the canonical address lives in Clerk.
4. Session is a JWT cookie set by Clerk middleware.
5. Server components: `const { userId } = await auth()` from `@clerk/nextjs/server`
6. API routes: same pattern, redirect or 401 if missing.

---

## Where to go next

- **For day-to-day operations**, read [`RUNBOOK.md`](./RUNBOOK.md).
- **For current state and pending work**, read [`STATUS.md`](./STATUS.md).
- **For history and "why is it like this"**, read [`DEVLOG.md`](./DEVLOG.md).
- **For the data model**, read `prisma/schema.prisma` — it's the source of truth and well-commented.
