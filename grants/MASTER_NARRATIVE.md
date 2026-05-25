# Master Narrative

The reusable building block. Every grant application pulls from this.
Customize the bracketed placeholders once, then reuse.

---

## One-line description

> Democracy Unlocked is a free, open-source civic-engagement platform
> that turns the U.S. Congress into something citizens can read, vote on,
> and hold accountable.

## One-paragraph description

> Democracy Unlocked is a free, nonpartisan web platform built on top of
> Congress.gov data that lets U.S. citizens read every pending bill in
> plain English, cast their own positions on legislation, and see exactly
> how their elected representatives' voting records line up with their
> own views. AI-generated summaries make complex legislation legible to a
> high-schooler in under a minute; deterministic state-impact mappings show
> which states are most affected by any given bill; and aggregated citizen
> sentiment is published openly, by state. The platform is open source
> (AGPL-3.0) so the prompts, ranking algorithms, and analysis methods can
> be inspected, audited, or forked by anyone. Live at
> [democracyunlocked.com](https://www.democracyunlocked.com).

## Three-paragraph description

> **The problem.** Most Americans want to participate meaningfully in
> federal lawmaking but face a wall of inaccessible information.
> Congress.gov publishes raw bills running thousands of pages in dense
> legalese; mainstream news coverage filters this through a partisan
> lens; and most "civic engagement" tools either push a particular
> agenda, sell user data to political campaigns, or both. The result is
> an information asymmetry that favors lobbyists, partisans, and the
> politically obsessed — and quietly disenfranchises everyone else.
>
> **What we built.** Democracy Unlocked is a free, nonpartisan platform
> that closes that gap. It pulls every bill in front of Congress directly
> from Congress.gov, uses Anthropic's Claude (under explicit nonpartisan
> system prompts) to generate plain-English summaries with balanced
> pros and cons, lets users cast their own positions, and surfaces
> per-state sentiment maps so people can see how their neighbors are
> reacting. A national party-makeup map and bill-by-bill timelines
> show where every piece of legislation sits in the lawmaking process
> and who has to act next. The codebase, AI prompts, and ranking
> methodology are public on GitHub under the AGPL-3.0 license — anyone
> can audit, fork, or contribute.
>
> **What we need.** The infrastructure is built and live; the data
> pipeline ingests Congress.gov daily; AI cost is optimized to under
> $0.05/month at current scale. The next 12 months are about three
> things: (1) growing the citizen-user base to the point where state
> sentiment data is statistically meaningful, (2) launching a
> notification system so users get alerts when bills they care about
> move, and (3) building partnerships with civic-education
> organizations and student-government programs to embed the tool in
> existing institutions. Funding from [FUNDER NAME] would directly
> underwrite the engineering and outreach hours needed for that push.

---

## Mission statement

To make every act of the United States Congress — from introduction
through enactment — instantly legible, verifiable, and accountable to
the citizens whose lives it governs. We build with open source and AI
because civic infrastructure should be auditable, and because the cost
of understanding your own government should be zero.

## Vision

A democracy in which informed citizen participation is the default,
not the result of luck, leisure, or insider access.

## Values

- **Nonpartisanship.** We don't endorse parties, candidates, or
  positions. Our AI prompts are public; our methodology is public;
  every bias claim is fixable via a pull request.
- **Open source.** AGPL-3.0. Anyone can verify how the system works,
  fork it, or improve it. No black-box civic infrastructure.
- **Privacy-first.** No ads, no third-party trackers, no data sales.
  Email and ZIP are encrypted at rest with our keys; IP addresses are
  one-way hashed. Full GDPR + CCPA compliance shipped before launch.
- **Direct sources.** Every bill, every vote, every roll call comes
  from official Congress.gov data — not aggregators, not curators.
- **Free forever.** The base product is free; premium tiers (if
  introduced) will be for power users (journalists, researchers) and
  will never gate basic civic participation.

---

## The theory of change

Civic participation is information-bottlenecked. The barrier between
"I'd vote on this bill if I knew what it said" and "I now know what it
says" is the entire problem. Lower that barrier and engagement follows.

1. Make every federal bill **readable** in under a minute (AI summaries).
2. Make every position **easily expressed** (one-click voting + reasoning).
3. Make every comparison **automatic** (your views vs. your rep's votes).
4. Make every aggregate **transparent** (per-state, per-policy
   sentiment maps, published publicly).
5. As citizens engage, public-opinion data becomes a counterweight
   to lobbyist-driven narratives in legislative debates.

This is the classic "transparency + low-friction action" theory of
change pioneered by GovTrack, OpenSecrets, and ProPublica — extended
into the modern AI era and rebuilt for the mobile/PWA generation.

---

## What we've built (as of [DATE])

### Live functionality
- **1,582 bills** from the 119th Congress, fully searchable + filterable by status, year, policy area, voting history, geographic impact
- **538 elected representatives** with full profiles, voting records, and alignment scoring vs. each citizen-user
- **~21,000 historical roll-call votes** aggregated into per-rep and per-state breakdowns
- **AI bill summaries + pros/cons** auto-generated for any bill on first user view (Claude Haiku 4.5; deterministic state-impact mapper for 10 high-volume policy areas means most analysis is AI-free)
- **National party-makeup map** colored by House-delegation lean, with click-through to per-state activity pages
- **Per-state civic-engagement pages** with AI digests, policy-area pie charts, top discussions, and full delegation cards
- **Bill lifecycle timeline** showing exactly where each bill is in the legislative process and who has to act next
- **Privacy controls** — full data export, account deletion, cookie preferences (GDPR Art. 17 + 20, CCPA, 8 state laws)
- **PWA** — installable on Android + iOS home screens with no app-store gatekeeping

### Live infrastructure
- Next.js 15 + React 19 + TypeScript on Vercel
- Supabase Postgres + Prisma for storage
- Clerk for authentication (no passwords stored on our side)
- AGPL-3.0 licensed; public on GitHub at [github.com/coworld-maker/we-the-people](https://github.com/coworld-maker/we-the-people)

### Already cost-controlled
- AI: ~$0.05/month at current scale, projected ~$30/month at 50K MAU (Claude Haiku 4.5 + prompt caching + deterministic mappers + lazy on-view triggers)
- Infrastructure: under $100/month total at 5K MAU
- See [`BUDGET.md`](./BUDGET.md) for the full breakdown

---

## Technical approach

### Pipeline
```
Congress.gov v3 API ─► nightly sync (GitHub Actions → Vercel)
                          │
                          ▼
                  Supabase Postgres (bills, members, roll-calls)
                          │
                ┌─────────┼─────────┐
                ▼         ▼         ▼
         Next.js SSR  AI Service  Per-state aggregations
                          │              │
                Claude Haiku 4.5     PolicyAreaPieChart,
                with prompt          StateSentimentMap,
                caching + lazy       USPartyMap
                on-view triggers
```

### What makes the AI nonpartisan
- System prompts are stored in `lib/services/aiService.ts` and visible on GitHub. Examples:
  - *"You are a nonpartisan civic education analyst. Be balanced, factual, fair. Never take sides."*
  - *"Stay neutral — do not take sides, do not endorse positions, do not characterize one party as better than another."*
- Cost controls keep generation cheap, but more importantly: **anyone can audit the prompts and flag bias as a GitHub issue.** No black box.

### Data privacy by construction
- Email + ZIP encrypted at rest with application-layer crypto
- IP addresses one-way hashed in audit logs
- Vote reasoning (sensitive: political opinion) encrypted with per-row IVs
- No third-party analytics, no advertising cookies, no data sales (ever)

---

## Team

> ⚠️ Replace this section with the real team bios.
> Funders read this carefully — keep it under 200 words per person,
> emphasize the relevant experience for the funder you're pitching.

**[YOUR NAME]** — Founder / Engineering. [1-2 sentence positioning.
Where you went to school if relevant, what you've built, why you're
doing this.] Based in [CITY, STATE]. [LinkedIn URL].

**[OTHER TEAM MEMBER]** — [Role]. [Bio.]

**Advisors**
- [If you have any. Otherwise omit this line.]

**Open-source community**
- We accept contributions from anyone via GitHub. [N] PRs merged from
  [N] external contributors in [period]. (Update once you have numbers.)

---

## Sustainability — how this stays alive after the grant

Civic-tech projects often launch with funding, then quietly die when the
grant runs out. Our model is designed to avoid that:

1. **Donor tier (already designed).** GitHub Sponsors + Ko-fi for
   recurring small-dollar support; planned launch within 30 days of any
   grant. Target: 1–2% of monthly active users contributing $5–10/mo.
2. **Premium subscription (planned).** Advanced alerts, bulk exports,
   API access for power users (journalists, researchers, civic-ed
   programs). Never gates the core product.
3. **B2B / institutional licensing.** White-label or branded subdomains
   for civic-education organizations, libraries, and student-government
   programs. We already have inbound interest from [LIST IF ANY].
4. **Open-source community.** AGPL ensures any commercial fork must
   also be open-source. The codebase becomes more valuable to maintain
   collaboratively than to abandon.
5. **Infrastructure runs cheap.** At <$100/month for 5K MAU and ~$300
   at 50K MAU, the operating cost is sustainable on small-donor revenue
   alone past 2K active supporters.

A reasonable forecast: by the end of year 1 with this funding, we expect
to be running on a blend of donor revenue + 1–2 institutional partners +
this grant. By end of year 2, donor + institutional revenue should cover
ongoing operations independently. Subsequent grant funding would expand
scope (state legislatures, multi-language UI, mobile-native app),
not replace operating budget.

---

## What the funding would do

> ⚠️ Customize per grant — the specific use of funds will vary by
> funder size + restrictions. Below is a default $100K / 12-month plan
> as a starting point.

| Allocation | Amount | What it buys |
|---|---|---|
| Engineering (1 founder, part-time) | $50,000 | Notifications system, mobile-native app, state-legislature integration, accessibility features |
| Community outreach | $15,000 | Partnerships with 5–10 civic-ed orgs, conference attendance, content marketing |
| Hosting, AI, data infrastructure | $5,000 | Vercel + Supabase + Anthropic at scale; OpenStates API tier |
| Legal + compliance | $5,000 | GDPR/CCPA review (already needed pre-EU launch), DPO services |
| Design + accessibility | $10,000 | WCAG 2.2 audit, design refresh, brand asset production |
| User research + iteration | $10,000 | Quarterly user interviews, A/B testing infrastructure |
| Contingency | $5,000 | Anything we didn't anticipate |
| **Total** | **$100,000** | |

Scaled smaller (e.g. $25K Mozilla MOSS) we'd cut the marketing,
research, and contingency lines first and focus on engineering. Scaled
larger ($500K Knight) we'd add a second engineer + a part-time
community manager.

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| **Perceived partisan bias** in AI summaries | All prompts public on GitHub; in-app flag-for-review on every summary; quarterly third-party audit by [civic org] once funded |
| **AI cost runaway** at scale | Multi-layer cost stack (deterministic mappers, prompt caching, lazy on-view triggers, staleness checks). Currently $0.05/mo; projected $30/mo at 50K MAU |
| **Data accuracy** (Congress.gov occasionally lags) | Display the source date stamp on every bill; nightly reconciliation jobs flag dropped records |
| **Burnout / bus factor** | AGPL ensures continuity if the founder steps back. Documentation in `docs/` lets a new contributor onboard in <1 day |
| **Hostile / coordinated user behavior** (vote manipulation, scraping) | Rate limiting, vote-deduplication on user ID, audit logs, GDPR-compliant IP hashing for abuse detection |
| **Regulatory / legal challenge** to civic-data publishing | All data is public-domain federal data; AGPL + nonpartisan operation gives strong First Amendment posture |

---

## Acknowledgments / partners (current)

- **Congress.gov / Library of Congress** — primary data source (public domain)
- **OpenStates** — state legislature data (CC0)
- **Jeffrey B. Lewis (UCLA)** — historical congressional district boundaries (CC0)
- **us-atlas / TopoJSON.US** — state cartographic boundaries (public domain)
- **Anthropic** — Claude API for AI analysis
- **The civic-tech community** for proving that public-interest software can ship and last

---

## Contact

- **Project lead**: [YOUR NAME] — [you@email]
- **Mailing address**: [PO Box / org address]
- **Website**: [democracyunlocked.com](https://www.democracyunlocked.com)
- **Source code**: [github.com/coworld-maker/we-the-people](https://github.com/coworld-maker/we-the-people)
- **Privacy / data inquiries**: privacy@democracyunlocked.com
- **Security disclosures**: security@democracyunlocked.com
