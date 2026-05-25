# Impact Metrics

What we'll measure to know whether this is working. Goal: every funder
gets a quarterly report showing real numbers, not vibes. The metrics
below pull from the same Supabase database the site runs on — no
separate analytics infrastructure or data broker required.

---

## North-Star Metric

**Monthly Active Civic Actions per User** = (votes cast + discussions
posted + reps contacted + bills tracked) / monthly active users

This blends low-effort actions (a vote) with higher-effort ones (a
discussion) into a single number that reflects depth of engagement,
not just traffic.

**Target trajectory**:
- Today: ~1.2 actions per MAU (early adopters skew high)
- Year 1 with funding: 0.6–0.9 (typical when broadening audience)
- Year 2: 1.0+ (depth via notifications, alerts, partnerships)

---

## Tier 1 — Output metrics (what we did)

| Metric | Source | Cadence |
|---|---|---|
| Bills synced from Congress.gov | `SELECT COUNT(*) FROM "Bill"` | Daily |
| Bills with AI summaries | `SELECT COUNT(*) FROM "Bill" WHERE "aiAnalyzedAt" IS NOT NULL` | Daily |
| Bills categorized (policy area) | `SELECT COUNT(*) FROM "Bill" WHERE "policyArea" IS NOT NULL` | Daily |
| Representatives tracked | `SELECT COUNT(*) FROM "Representative" WHERE "currentTerm" = true` | Weekly |
| Congressional roll-call votes synced | `SELECT COUNT(*) FROM "CongressVote"` | Daily |

These are baseline "we kept the lights on" numbers. Important for
demonstrating that the data infrastructure works, but not the point.

---

## Tier 2 — Outcome metrics (who used it, how)

| Metric | Source | Cadence |
|---|---|---|
| Total registered users | `SELECT COUNT(*) FROM "User"` | Weekly |
| MAU (monthly active users) | Distinct users with any action in last 30 days | Monthly |
| WAU/MAU stickiness ratio | (WAU / MAU) — anything >25% is healthy | Monthly |
| Votes cast by citizens | `SELECT COUNT(*) FROM "Vote"` | Weekly |
| Bills with citizen-voting activity | `SELECT COUNT(DISTINCT "billId") FROM "Vote"` | Weekly |
| Discussions posted | `SELECT COUNT(*) FROM "Discussion"` | Weekly |
| Users who set their state | `SELECT COUNT(*) FROM "User" WHERE state IS NOT NULL` | Weekly |
| Users with ≥5 votes | `SELECT COUNT(DISTINCT "userId") FROM "Vote" GROUP BY ... HAVING COUNT > 5` | Monthly |

---

## Tier 3 — Equity + reach metrics

We care that we're not just serving educated urban coastal users.

| Metric | Source | Cadence |
|---|---|---|
| States represented (≥10 active users) | Group `User.state` count | Monthly |
| Geographic concentration (top-5 states' share of MAU) | Lower = more distributed reach | Monthly |
| Bills with state-specific impact data | `WHERE "stateImpacts" IS NOT NULL` | Monthly |
| Discussion participation rate | (users who posted) / MAU | Monthly |

**Target by end of year 1**: at least one active user in all 50 states.
The geographic-concentration metric is the honest one — if 60% of MAU
is in CA/NY/MA we have a reach problem to solve.

---

## Tier 4 — Trust + accuracy metrics

| Metric | Source | Notes |
|---|---|---|
| AI-summary flag rate | In-app "flag for review" button (to be built) | Target: <1 in 200 summaries flagged. Higher = bias-detection time |
| Factual-error reports | Via privacy@/legal@ mailbox | Track, publish a summary in annual transparency report |
| Privacy data exports executed | `AuditLog WHERE eventType = 'DATA_EXPORT'` | Healthy if non-zero — proves the right works |
| Privacy account deletions | Count over time | Track for context only; we want to know the rate |
| Time-to-resolve user-reported issues | GitHub issue first-response + close-time | Target: <72h first response, <30d close |

---

## Tier 5 — Sustainability metrics

| Metric | Source | Notes |
|---|---|---|
| Monthly recurring donor revenue | Stripe / Ko-fi / GitHub Sponsors dashboards | Target: $500/mo by month 6, $2K/mo by month 12 |
| Open-source contributors (external) | GitHub PRs from non-team accounts | Healthy >5/quarter by month 6 |
| Stars / forks | GitHub | Vanity but useful for fundraising/credibility |
| Institutional users (B2B) | Count of named partner organizations | Target: 1 by month 6, 3 by month 12 |
| Cost-per-active-user ($/MAU) | Total monthly spend / MAU | Target: stays under $0.05 at scale |

---

## How we report back to funders

Quarterly to every funder, end-of-year cumulative:

- **Quarterly transparency report** (single PDF): all of the above
  numbers in a one-page chart + 1–2 paragraphs of qualitative reflection
  (what we learned, what shifted, what we're trying next)
- **Annual report**: longer; includes anonymized user stories,
  case studies of bills where citizen sentiment shifted public
  discourse, third-party audit notes (if commissioned), updated
  three-year plan
- **Real-time dashboard** (planned): public stats page at `/transparency`
  on the live site, machine-readable JSON endpoint at `/api/stats` so
  funders can poll without needing to read PDFs

Funders can also request raw access to anonymized usage data on
request — no NDAs, no theatrical secrecy. The data is public domain
anyway in aggregate.

---

## What we're NOT measuring

For credibility and clarity, here's what we don't track or claim:

- **Political outcomes.** We don't claim that any specific bill passed
  or failed because of our platform. Causation is unprovable; we
  build infrastructure, not lobbying.
- **Vanity engagement** (likes, follows, social-media reach). We use
  these as signals but never as primary KPIs.
- **Individual user profiles.** We aggregate; we don't profile
  individuals for "civic engagement score" claims to third parties.
- **Political-leaning of users.** We never store, ask, or infer a
  user's partisan affiliation — only their positions on specific bills.
  This is a deliberate choice; many "civic tech" tools cross this line.
