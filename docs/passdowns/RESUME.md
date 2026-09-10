# ▶ RESUME HERE — fast bootstrap for the next session

_Last updated: 2026-09-10 (see the 2026-09-10 status block below). This is the "start here" file. Latest detail:
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

## ⛳ Status (2026-09-10)
**✅ All below merged to `main` and verified on production.**
- `ebdd321` — the fabricated "Your Impact" donut and hardcoded contacts are gone (real
  delegation alignment or "Not enough overlap yet"); AI confidence is null when missing, not 70.
  **§6.6 and §6.7 of the 2026-09-02 passdown are CLOSED.**
- `370b39d` — "Affects GA" → "Likely affects GA" with the stored `reason` as tooltip; one
  `STATE_IMPACT_HIGH` threshold.
- `19a8a45` / `ada1482` — ZIP lookup returns every district a ZIP spans (21.6% of ZIPs; 109 cross
  a state line). Ambiguous ZIPs ask; cross-state ZIPs show both senator pairs, labelled.
- `1b3a576` — accessibility: `--text-muted` #94A3B8 → #5F6B7E and `--gold-text` → #7E5E12
  (site-wide, both now ≥4.5:1 on every surface); cookie banner is a compact bottom bar that pads
  the body instead of covering the ZIP field; ZIP inputs labelled + `autocomplete="postal-code"`;
  44px header/footer targets. `Logo` now renders the SVG mark only — `/logo-mark.png` was never
  committed and 400'd on every load. Favicon is `app/icon.svg`.
- `2f48a32` — **new landing hero, "Your ZIP is the key"** (`components/landing/CivicHero.tsx` +
  `KeyLock.tsx`, timings in `globals.css` under `.keylock`). Each ZIP digit cuts a tooth; states
  are idle → turning (lookup in flight, key already travelling) → unlocked (key seats, dome
  shackle lifts, results fade in). Split enter/exit timing, transforms only, reduced-motion safe.
  Landing header is navy to match. Lookup/ask/cross-state logic unchanged.

- `3377099` — after a four-voice design council review: hero a11y (one `role="status"`
  region announces loading / district ask / delegation / errors; focus moves to the delegation
  heading after a pick and back to the first option on "change district"; `aria-invalid` +
  error #FFB4A8 8.5:1; result blocks `inert` while fading; cookie bar sets
  `scroll-padding-bottom`). Logo redrawn as a SOLID Capitol dome (the colonnade strokes read as
  jail bars); `Logo.tsx` exports `DOME_SHACKLE_PATH`/`KEYHOLE_PATH`, which `KeyLock.tsx` reuses.
  Dropped the unsourced "all 537 members" (now "every current member of Congress").
  **Open:** the key's bow in `KeyLock.tsx` is still the old stroked dome — match it to the
  solid mark. **Tagline pending the user's pick** — council rejected "Understand your impact"
  (it reasserts the personal-impact claim removed from the dashboard); top option
  "Do your reps vote like you?", button "Find my reps".

**UI redesign is back ON, at the user's request** — this supersedes the 2026-07-05 "cancelled / do
not resume UI work" note below. Direction chosen by the user: the Capitol-dome lock as the mark and
the ZIP-cut key as the hero (mockups: "The Lock Studies" → "The Dome and the Key").
**Next candidates:** nav logo → the refined dome-shackle drawing (touches dashboard + legal
layouts too, ask first); the rest of the landing page (feature cards and "Three steps" repeat each
other; blue→red CTA gradient reads partisan); "Meet the Founder" section (needs the user's bio).
**Gotcha:** `next lint` has no ESLint config here — running it opens an interactive setup and
rewrites `tsconfig.json`. Don't run it; if it happens, restore with `git show HEAD:tsconfig.json`.

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
