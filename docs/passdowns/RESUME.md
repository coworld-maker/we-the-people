# ▶ RESUME HERE — fast bootstrap for the next session

_Last updated: 2026-09-11 evening (see the top status block below). This is the "start here" file. Latest detail:
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
**Superseded:** the old `landing-broadsheet` branch is gone; the landing page was redesigned in Sep 2026 (see the status blocks below).
**Known silent-empty risks (not fixed):** `/elections` (static fallback now exists, but live data still needs retired Google Civic API), lobbying firm-count badge (sync-lobbying unscheduled), `OPEN_FEC_API_KEY` unset in Vercel. See latest passdown §3.

## ⛳ Status (2026-09-11, evening)
**✅ Merged to `main` and verified on production** (except where marked). 76 unit tests.
- **Key hero:** mobile-first order, redrawn key, scroll-to-results on phones only (`a17b11e`). The
  key's bow already matches the solid dome — ignore that "Next candidate" in the block below.
- **About page** (`app/(dashboard)/about/page.tsx`, the only /about route): restyled to the redesign
  (flat navy, serif, ruled lists) with a "Meet the founder" section (`public/founder.jpg`, name
  Coleman Dumas IV). The bio was drafted by Claude and published at the founder's request ("publish
  for now") — he may edit it. **"Nonpartisan" is a staple — keep it** (hero eyebrow, landing CTA,
  About). Still-unverified About claims: "Free forever", AI "impact assessment across demographics".
- **Nav:** About tab in the desktop NavBar, an About link in the landing header, and a **5th mobile
  tab** — supersedes the June "mobile tab bar stays at 4 tabs" decision.
- **Public signed out:** `/privacy`, `/terms`, `/about`, the `/bills` list, and every bill-page
  section. `middleware.ts` also lists the read APIs `/api/bills/(.*)/state-impact`,
  `/state-sentiment` and `/discussions`. The matcher is path-based, not method-based: **every write
  handler on those routes keeps its own auth check** (verified 401 signed out) — never remove them.
- **Privacy:** discussion authors leave the server only as `{ id, username, displayName }`
  (`lib/data/discussionAuthor.ts`, tested). Full last names used to reach every signed-in browser.
- **Signed-out UX:** notification bell only for signed-in users (`<SignedIn>`); search shows "Sign
  in to search" (search stays signed-in only — founder's choice); BillImpactMap never
  auto-generates AI analysis for signed-out visitors; DiscussionBoard shows a sign-in prompt and
  hides Reply/Report. These components also treat a 401/404 as signed out, because **Clerk never
  loads on preview domains** (`window.Clerk.loaded` stays false) — `useAuth()`-gated UI can't be
  checked on previews, only on production.
- **Alignment** (`e143549`): `AlignmentService.calculateAlignment` reads stored `CongressVote`
  (`ON_THE_BILL`, latest per bill) instead of live Congress.gov calls, and `alignmentPct` is null —
  never 0 — with no overlap ("No shared votes yet" on the rep card). Both alignment calcs share
  `tallyAgreement` (`lib/data/agreement.ts`, tested). On 2026-09-11 only 6 users had yes/no votes
  and none overlapped their delegation's passage votes, so every score is "no shared votes yet".
  **Not verified signed in.**
- **Tab titles:** pages set a bare `title`; the root layout's template adds "| Democracy Unlocked"
  (it was doubled on 13 pages). Don't hard-code the site name in a page title again.
- **Preview gotcha:** create `get_access_to_vercel_url` links for a deployment's own URL *after* it
  is READY. Links made mid-build, or for the branch alias, bounce to the Vercel login page.
- **Open:** owner should eyeball signed-in pages (dashboard alignment, scorecards); AI summary
  backlog ~2,160 bills, clearing ~600/night (nightly job green all week); `/elections` still needs
  the retired Google Civic API; Terms trademark clause undrafted; digest needs a verified Resend
  domain; unmerged remote branch `claude/fix-vercel-deployment-Ld6an` was left alone (not ours).

## ⛳ Status (2026-09-11)
**✅ Merged to `main` and verified on production** (except where marked).
- **Roll calls, not bills** (`961905f`). `CongressVote` is now one row per member per ROLL CALL:
  unique `(bioguideId, chamber, congress, session, rollNumber)`, plus `question` ("On Passage",
  "On Cloture on the Motion to Proceed", …) and `kind` ('passage' | 'procedural'). The old
  `(bioguideId, billId)` unique index is DROPPED (Supabase migrations
  `congress_vote_per_roll_call_step1/2`). Why: 37 of 44 stored Senate and 31 of 124 House roll
  calls were procedural but shown/scored as a Yea/Nay on the bill, and later roll calls
  overwrote earlier ones member by member. `lib/data/voteKinds.ts` is the single source:
  `classifyVote` (House "rules" = procedural), `agrees()`, `ON_THE_BILL`, `latestPerMemberBill`.
  **Every "how did they vote on this bill" / alignment reader must filter `ON_THE_BILL`.**
- **Casing bugs fixed in the same change** — stored positions are lowercase ('yea', 'not_voting');
  user votes are 'yes'/'no'/'abstain'. Were silently never matching: dashboard delegation
  alignment (always "not enough overlap"), scorecard alignment (every overlap a disagreement →
  false 0%), bill-page "Agrees with you", rep-mismatch feed (and its text always said "voted NO"),
  My Representatives recent votes. Scorecard "party line" counted the whole chamber; now same
  party, per roll call. **Not verified in a signed-in browser** — Clerk won't run on previews and
  we can't sign in to prod. Owner should eyeball dashboard + a scorecard.
- **Sync** captures the question (Clerk XML / senate.gov menu), writes one multi-row upsert per
  roll call (`a829f81`; was ~435 round-trips each), and takes `rolls: [..]` to (re)process
  explicit roll numbers, skipping ones already complete.
- **Restore — DONE.** The old high-water-mark skip meant most roll calls were never stored. A
  scan of the official records found 559 roll calls on bills we hold missing/incomplete; a
  one-off workflow refilled them (since deleted, `a909143`). Now: **House 432 roll calls /
  186,467 member votes (254 on the bill itself); Senate 204 / 20,037 (48 on the bill itself)**,
  up from 124 and 44. Every row has `question` and `kind`; no partial roll calls.
- **Senate questions were never captured** by the sync: senate.gov's vote menu wraps
  `<question>` onto a new line and the parser used a `.`-regex. Fixed (`a909143`, reads the
  per-vote XML) and the 162 affected roll calls backfilled from the official records.
- **Amendment-vote gap — CLOSED** (`b69ae3d`). Congress.gov's House vote list names the
  amendment, not the bill, for amendment roll calls, so the sync skipped 87 of them. The sync
  now falls back to the House Clerk's `<legis-num>` (`parseLegisNum` in voteKinds.ts). All 87
  restored; **House now 280/280 (2025) and 239/239 (2026) roll calls on bills we hold — an
  exact match with the official records**; Senate 136 and 68. 0 rows without question/kind.
- **Landing:** headline "See what Congress is doing.", button "Find my reps"; ambiguous ZIPs
  offer "Not sure which? Use your street address" → `POST /api/landing/district-by-address`
  (US Census geocoder; address never logged/stored) + house.gov fallback link. Tested:
  30165 + "1600 Martha Berry Hwy NW" → GA-14 auto-picked, focus + status correct.
- **Signed-out visitors** to protected pages now get `/sign-in?redirect_url=…` (307) instead of
  a 404 (`b1dd82c`, `middleware.ts`). APIs unchanged.
- **AI summary backlog:** nightly pre-warm raised to ~600/night (`45e96f2`); 2,198 bills were
  unsummarised → ~4 nights, ~$22 of Anthropic credit at ~$0.01/bill.
- **Next candidates:** the key's bow in `KeyLock.tsx` is the old stroked dome (match the solid
  mark); "Recent votes" panel on rep cards (option A from the council, now unblocked by
  `kind`); `alignmentService.calculateAlignment` still returns `alignmentPct: 0` when a user has
  no votes (should be null) and reads votes live from the Congress API rather than `kind`.

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
