# Dev Log

A running, reverse-chronological log of meaningful work on Democracy Unlocked.
Newest entries on top. Each entry covers: **what shipped**, **why**, **how to verify**, and (when relevant) **what's next**.

> **For new contributors**: read [`STATUS.md`](./STATUS.md) for a current snapshot, [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the system overview, and [`RUNBOOK.md`](./RUNBOOK.md) for ops. Then come back here for context on recent decisions.

---

## How to add an entry

When you ship something meaningful (a feature, a fix that took non-trivial debugging, an architectural decision), add a section at the top of this file:

```markdown
## YYYY-MM-DD — [your name or initials]

### Short title of the work

**What shipped:** Brief paragraph. Link to commit(s).

**Why:** The motivation. What problem this solves, or what user feedback drove it.

**How to verify:** A specific URL, command, or query that proves it works.

**Decisions / tradeoffs:** Anything non-obvious about the approach. What you considered and rejected.

**What's next** (optional): Follow-ups that didn't make it into this PR.
```

Hashes are stable; link them via `[commit](https://github.com/coworld-maker/we-the-people/commit/SHA)`.

---

# Entries

## 2026-05-24

### Fix data-sync pipeline end-to-end
**Commits**: [`9e54627`](https://github.com/coworld-maker/we-the-people/commit/9e54627), [`d6ecd5b`](https://github.com/coworld-maker/we-the-people/commit/d6ecd5b), [`c347335`](https://github.com/coworld-maker/we-the-people/commit/c347335), and a workflow `maxVotes` reduction

**What shipped:** The daily sync workflow has been silently failing for weeks. Three independent bugs unblocked, in order of discovery:

1. **`sync-bills` auth-header mismatch** — only accepted `x-sync-secret`, but the cron orchestrator sends `Authorization: Bearer`. Added Bearer support to match the other sync endpoints.

2. **Orchestrator hit the wrong host** — `BASE_URL` defaulted to apex `democracyunlocked.com`. Apex 301-redirects to `www.democracyunlocked.com`, and `fetch()` strips the `Authorization` header across host hops (standard browser security). All child calls arrived unauthenticated. Defaulted `BASE_URL` to the www host.

3. **Workflow split into 4 parallel jobs** — the orchestrator hit Vercel's 300s function ceiling, returning 504. Calling each sync directly from separate parallel jobs gives each its own budget.

4. **`/api/sync-representatives` missing from Clerk middleware whitelist** — middleware blocked the request before the route handler could check `CRON_SECRET`. Added to the public-route matcher (handler still checks the secret itself).

5. **`sync-congress-votes` perf** — even isolated, 50 House roll calls × 435 sequential member-vote upserts = ~21,750 round trips, blowing the 300s ceiling. Reduced `maxVotes` from 50 → 10 in the workflow as immediate unblock.

**Why:** Data was 5 weeks stale (latest bill 2026-04-06, latest vote 2026-04-20). Without the workflow running, the site's data is frozen in time.

**How to verify:** After triggering at https://github.com/coworld-maker/we-the-people/actions/workflows/sync-bills.yml, run:
```sql
SELECT MAX("introducedDate") AS latest_bill,
       MAX("votedAt")        AS latest_vote
FROM "Bill", "CongressVote";
```
Both dates should advance after each workflow run.

**What's next:**
- ⚠️ **Refactor `sync-congress-votes` upsert loop** to a single multi-row `INSERT ... ON CONFLICT` per roll call. Currently each member-vote is a separate round-trip; multi-row would be ~30× faster and let us raise `maxVotes` back to 50+. The dynamic SQL building is straightforward — just risky to ship at 11 PM.
- Add `prisma.bill.findFirst` cache inside the loop (currently looks up the bill once per roll call; could batch-fetch).
- Consider Inngest or QStash for true background job execution if we need to backfill historical congresses.

---

### Privacy & data-rights compliance package
**Commits**: [`790bcfe`](https://github.com/coworld-maker/we-the-people/commit/790bcfe) → [`47f19de`](https://github.com/coworld-maker/we-the-people/commit/47f19de)

**What shipped:** Full GDPR + CCPA/CPRA + 8-state US privacy compliance:
- `/privacy` Privacy Policy and `/terms` Terms of Service pages, shared `(legal)` layout, `.prose-legal` styles in `globals.css`
- `/account/privacy` Privacy Controls dashboard with cookie preferences, data export, account deletion
- `GET /api/account/export` — GDPR Art. 20 data portability, returns JSON bundle
- `POST /api/account/delete` — GDPR Art. 17 erasure, transactional DB cleanup + Clerk identity removal
- `<CookieConsent>` banner mounted in both dashboard and landing layouts
- Footer links to Privacy / Terms / Your Data on every page

**Why:** Required for any production launch in the EU/UK and for compliance with the patchwork of US state privacy laws (CA, VA, CO, CT, UT, TX, OR, MT, DE). Especially critical because we process political opinions (GDPR Art. 9 "special category").

**How to verify:**
- Visit `/privacy` and `/terms` — both render with the legal layout
- Sign in → `/account/privacy` → "Download my data" yields a JSON file with profile / votes / discussions / audit logs
- Cookie banner appears on first visit, persists choice in localStorage

**Decisions / tradeoffs:**
- Built our own banner rather than using a vendor (OneTrust, Iubenda) — adds maintenance burden but avoids a recurring fee and a 50-KB third-party script.
- Vote `reasoning` is stored encrypted (`reasoningEncrypted` + IV + Tag); the export reports it as `reasoningPresent: true/false` rather than decrypting in-bundle. Decrypted plaintext available via email request after identity verification.
- IP addresses in `AuditLog` are one-way hashed (`ipAddressHash`) rather than stored raw — better privacy posture than typical, and the schema already supported it.

**What's next:**
- ⚠️ **Pre-launch**: get the policy reviewed by counsel. The site processes special-category data under GDPR — counsel review is mandatory before EU launch.
- Replace placeholders (`[address — fill in before launch]`, `[appoint EU representative]`) in `app/(legal)/privacy/page.tsx`.
- Set up `privacy@democracyunlocked.com` and `legal@democracyunlocked.com` mailboxes (referenced from both legal docs).
- Sign DPAs with Clerk, Supabase, Vercel, Anthropic, email provider.

---

### Landing page recolored to patriotic palette + animation removed
**Commits**: [`bc9825d`](https://github.com/coworld-maker/we-the-people/commit/bc9825d), [`93dcb06`](https://github.com/coworld-maker/we-the-people/commit/93dcb06), [`d136fc9`](https://github.com/coworld-maker/we-the-people/commit/d136fc9)

**What shipped:** Landing page (`app/page.tsx`) recolored from dark theme to the `--accent` navy / `--accent-red` palette used elsewhere. Hero uses the same `.hero-gradient` (navy → wine red → crimson) seen on `/states/[code]` and `/policy-areas/[area]`. Unlock-on-click animation was tried then removed — felt like a gate between intent and action.

**Why:** Landing was the last dark-themed surface — every other page is light with navy accent. Returning visitors are no longer entering a visually different product when they cross from landing to dashboard.

**Decisions / tradeoffs:** Considered keeping the animation as a one-time intro on first session (sessionStorage gated), but the click trigger felt overdesigned. Stripping to a plain `<Link>` made the click feel instant.

---

### Logo: image asset + SVG fallback + favicon pipeline
**Commits**: [`c9927f4`](https://github.com/coworld-maker/we-the-people/commit/c9927f4), [`f0b49e6`](https://github.com/coworld-maker/we-the-people/commit/f0b49e6), [`523127c`](https://github.com/coworld-maker/we-the-people/commit/523127c)

**What shipped:** Brand logo system:
- `<Logo>` component renders `/logo.png` via Next.js Image, with an inline-SVG fallback when the image is missing (via `onError`)
- `scripts/prepare-logo.py` generates 6 derivatives from a single source: `logo-mark.png` (cropped icon), `app/icon.png` (favicon), `app/apple-icon.png` (iOS), `icon-192.png` + `icon-512.png` (Android PWA)
- `app/manifest.ts` web app manifest — Android "Add to Home Screen" → standalone PWA, launches at `/dashboard`, navy theme color, white splash
- Apple PWA meta tags in `app/layout.tsx` for iOS Safari "Add to Home Screen"

**Why:** Needed a real brand identity. PWA support gives mobile users a native-feeling experience without an app store.

**How to verify (after `public/logo.png` is in place + script run):**
- Browser tab favicon shows the logo
- Chrome DevTools → Application → Manifest → green "Installability" check
- Android Chrome → "Add Democracy Unlocked to Home Screen" prompt

**What's next**: ⚠️ Drop the brand logo at `public/logo.png` and run `python3 scripts/prepare-logo.py`. Without this the SVG fallback covers the site but it's monochrome.

---

### National party-makeup map
**Commits**: [`cee486d`](https://github.com/coworld-maker/we-the-people/commit/cee486d), [`e974467`](https://github.com/coworld-maker/we-the-people/commit/e974467), [`3f436c9`](https://github.com/coworld-maker/we-the-people/commit/3f436c9), [`2593330`](https://github.com/coworld-maker/we-the-people/commit/2593330), [`e4bc0b0`](https://github.com/coworld-maker/we-the-people/commit/e4bc0b0), [`d5d70c3`](https://github.com/coworld-maker/we-the-people/commit/d5d70c3)

**What shipped:** `USPartyMap` component on `/scorecards`:
- State-level choropleth colored by House delegation balance
- 7 discrete tiers (deep blue → light blue → gray → light red → deep red), purple reserved for states with ≥20% Independent representation
- Fixed `geoAlbersUsa()` projection (scale 1280 + translate), no `fitSize()` — robust against outlier coordinates
- Hover shows full delegation breakdown; click → `/states/[code]`

**Why:** Quick national-overview pane for the scorecards page. Helps users understand the political landscape at a glance.

**Decisions / tradeoffs:**
- **Tried district-level toggle, removed it.** Even after fixing the state-name normalization (`Representative.state` is full name like "California"; the rest of the app uses 2-letter codes — see `lib/utils/state-codes.ts`) and shipping 1.2MB of GeoJSON district boundaries, the visual fidelity wasn't worth the asset weight. The 1.2MB asset and 250 lines of code lived for ~24h before being stripped.
- Discrete tiers beat continuous color ramp — every state ending up purple wasn't useful. New convention matches Wikipedia / NYT / 270toWin.

---

### State page enhancements: AI digest + policy pie + better delegation
**Commit**: [`759ca5b`](https://github.com/coworld-maker/we-the-people/commit/759ca5b), [`5060796`](https://github.com/coworld-maker/we-the-people/commit/5060796)

**What shipped:** On `/states/[code]`:
- `StateAIDigest` — Claude-generated 2-paragraph plain-English summary of what's happening in the state. Cached in-memory 24h per state.
- `PolicyAreaPieChart` — pure-SVG donut, top-8 + "Other" bucket, hover-driven center label
- `DelegationCard` — redesigned rep cards with party-colored stripe + circle, better role labels

**Why:** Tapping a state was a "list of facts" experience. Now it's a story.

**How to verify:** Tap any state on the National Map → AI digest renders at the top, pie chart on the right.

**Decisions / tradeoffs:**
- Caching the AI digest in-memory per lambda. Cheap, but each Vercel lambda instance regenerates independently. For better cost control at scale, add a `StateDigest` table.
- AI fired on mount (no `IntersectionObserver`) because the digest is above-the-fold on the state page — almost always read.

---

### Bill timeline
**Commit**: [`759ca5b`](https://github.com/coworld-maker/we-the-people/commit/759ca5b)

**What shipped:** `BillTimeline` component on `/bills/[id]`:
- 6-step horizontal stepper (Introduced → In Committee → Reported → Passed Chamber → Passed Both → Enacted)
- Animated progress line, current step highlighted, click any step for context
- "Next:" banner shows who's expected to act next (specific committee name parsed from `Bill.actions` JSON when available)

**Why:** User feedback — "I want to see where a bill is in the legislative process and what happens next."

**Decisions / tradeoffs:** `lib/utils/billStages.ts` parses `Bill.actions` best-effort. Action wording varies; we extract committee names from "Referred to the Committee on X" but don't try to handle every conceivable phrasing.

---

### AI cost optimization
**Commit**: [`49a99ba`](https://github.com/coworld-maker/we-the-people/commit/49a99ba), [`d9730e6`](https://github.com/coworld-maker/we-the-people/commit/d9730e6), [`497d173`](https://github.com/coworld-maker/we-the-people/commit/497d173), [`01b4d63`](https://github.com/coworld-maker/we-the-people/commit/01b4d63)

**What shipped:** Four cost-reduction layers on top of the AI pipeline:
1. **Deterministic state-impact mapping** for 10 high-volume policy areas (Agriculture, Energy, Public Lands, Water Resources, Immigration, Foreign Trade, Armed Forces, Native Americans, Housing, Environmental Protection). Zero AI cost for bills in these areas. Source: `lib/data/state-impact-weights.ts`.
2. **CRS summary skip** — when `Bill.summary` is ≥200 chars, the AI prompt omits the summary field and we plug the CRS summary back in afterward. ~30% output-token reduction.
3. **Prompt caching** on `callClaude`'s system block via `cache_control: { type: 'ephemeral' }`. Repeat calls within 5min cost 10% of system tokens.
4. **30-day-staleness-on-status-change-only** skip in `analyzeAndSaveBill`. Most bills don't get re-analyzed.

Plus: **`CLAUDE_MODEL` constant + `npm run check:model` script** for deprecation guarding. The 404 from a retired model now becomes an actionable error message naming the file to update.

**Why:** AI cost was the biggest unknown in the cost model. Combined estimate: ~$0.40 first-month seed, ~$0.03/month steady-state at current scale assumptions.

**How to verify:** `npm run check:model` reports model status. AI analysis on a bill with policyArea in the deterministic set should not hit Anthropic at all.

---

### Auto-trigger AI analysis on first view
**Commit**: [`c02b54c`](https://github.com/coworld-maker/we-the-people/commit/c02b54c)

**What shipped:** `AISummary` + `BillImpactMap` auto-fire on first view instead of waiting for a click.
- `AISummary` uses `IntersectionObserver` (200px rootMargin) — only fires when the user scrolls there
- `BillImpactMap` fires on mount (most resolves via deterministic mapper instantly)
- `router.refresh()` replaces full page reload after successful analysis
- "Try again" + CRS-summary fallback on error

**Why:** Manual "Generate" button created friction. With cost optimization in place, the auto-trigger is essentially free for most bills.

---

### Bills page filter expansion + /policy-areas funnel
**Commits**: [`e521294`](https://github.com/coworld-maker/we-the-people/commit/e521294), [`07aadad`](https://github.com/coworld-maker/we-the-people/commit/07aadad), [`320ab1e`](https://github.com/coworld-maker/we-the-people/commit/320ab1e), [`0c65e31`](https://github.com/coworld-maker/we-the-people/commit/0c65e31)

**What shipped:**
- Bills filters: policy area dropdown, "Affects my state" toggle (JSON-path query on `stateImpacts`), "Voted on by my state", "Voted by me / Not voted yet"
- `?groupBy=policy` view mode — bills sectioned by policy area with header counts
- `/policy-areas` restored as a card grid funneling into `/bills?policyArea=…`
- NavBar reorganized: 6 top-level items with grouped dropdowns + mobile hamburger drawer

**Why:** 12-link nav bar overflowed at every breakpoint and the bills page lacked the obvious filters users wanted (their state, what they've voted on, by topic).

---

### State-level features A–F + B (state sentiment lens, /states/[code], AI impact heatmap, OpenStates, member-state alignment, badges)
**Commits**: [`5648122`](https://github.com/coworld-maker/we-the-people/commit/5648122), [`b93f031`](https://github.com/coworld-maker/we-the-people/commit/b93f031), [`4e31333`](https://github.com/coworld-maker/we-the-people/commit/4e31333)

**What shipped:** The whole state-level vertical:
- **A** — `User.state` column + index, persisted via `POST /api/user/state` from both maps. Choropleth on every bill page colored by yes-share.
- **D** — `/states/[code]` page: hero, stat cards, most-voted bills with breakdowns, recent discussions, rep activity, delegation sidebar.
- **F** — AI-generated `Bill.stateImpacts` per-state scores (now mostly deterministic per the optimization above).
- **E** — `OpenStatesService` + `/api/states/[code]/state-bills` for state legislature integration. Gated on `OPENSTATES_API_KEY`; hides gracefully when unset.
- **C** — `/api/scorecard/[bioguideId]/state-alignment` comparing each rep's roll-call votes to their state's citizen votes.
- **B** — "Affects your state" badges on bills list + recommended bills card.

**Migrations** (applied to prod via Supabase MCP, not Prisma migration history):
- `add_user_state` — added `User.state TEXT` + index
- `add_bill_state_impacts` — added `Bill.stateImpacts JSONB` + `Bill.stateImpactsAt TIMESTAMP`

Schema source-of-truth note: ⚠️ Prisma's `_prisma_migrations` table doesn't have these. If you later run `prisma migrate deploy` locally it may flag them as unapplied — use `prisma migrate resolve --applied …` against prod, or delete the two migration folders in `prisma/migrations/` (their SQL is already in the DB).

---

### Patriotic palette
**Commit**: [`490c269`](https://github.com/coworld-maker/we-the-people/commit/490c269)

**What shipped:** `--accent` swapped from indigo `#635BFF` to Old Glory navy `#0A2463`. New `--accent-red` family (`#B91C1C`). All tokens in `globals.css` updated. `.hero-gradient` becomes navy → deep navy → wine red → crimson.

**Why:** Brand fit for a civic-tech product.

---

## Earlier work

See `git log` for full history. Pre-2026-05-24 work spans: initial scaffolding, Clerk auth, Congress.gov sync, AI analysis pipeline, bill detail page, voting, scorecards, alignment scoring, discussions, civic-score gamification, news section, learn section, theme migration to light mode.

For any of these areas where you need context, run:
```bash
git log --oneline -- path/to/relevant/file.tsx
```
and inspect the commit messages — they're verbose and decision-oriented.
