# Budget

Twelve-month operating budget — current run-rate, scenario at $100K
grant award, and three-year projection. Pull whichever lines you need
into a specific application; many funders have their own budget templates.

---

## Current run-rate (no grant, no paid users)

| Category | Monthly | Annual | Notes |
|---|---|---|---|
| Hosting (Vercel Pro) | $20 | $240 | Required for team + analytics |
| Database (Supabase Pro) | $25 | $300 | 8GB DB, daily backups |
| Auth (Clerk) | $0 | $0 | Free tier covers <10K MAU |
| AI (Anthropic Claude) | ~$0.05 | ~$1 | At current scale; lazy-trigger + cost stack |
| Email (Resend) | $0 | $0 | Free tier covers <3K/month |
| Domain | ~$1 | $12 | democracyunlocked.com |
| Source control (GitHub Free) | $0 | $0 | Public repo |
| **Total infrastructure** | **~$46** | **~$553** | |
| Founder time (currently unpaid) | — | — | Not in cash budget |
| **Total cash** | **~$46/mo** | **~$553/yr** | |

We can run the live site indefinitely on ~$50/month. The question
isn't survival — it's growth.

---

## 12-month plan if funded ($100K target)

| Allocation | Amount | What it buys |
|---|---|---|
| **Engineering — founder, part-time** | $50,000 | Notifications, mobile app, state legislatures, WCAG 2.2 accessibility, performance scaling work. Roughly 600 hours @ ~$85/hr blended. |
| **Community outreach + partnerships** | $15,000 | Travel to 2–3 civic-tech conferences; partnership outreach to civic-ed orgs, libraries, university student governments; content commissioning |
| **Hosting, AI, data infrastructure (at growth scale)** | $5,000 | Vercel Pro + bandwidth, Supabase scale-up, Anthropic at 50K MAU projection, OpenStates paid tier |
| **Legal + compliance** | $5,000 | Privacy policy review by qualified counsel (required pre-EU launch), DPO services, terms of service review |
| **Design + accessibility** | $10,000 | WCAG 2.2 audit + remediation, brand refresh, illustration work for marketing |
| **User research + iteration** | $10,000 | Quarterly cohorts of user interviews (~$2K each), survey tooling, retention analytics |
| **Contingency** | $5,000 | For anything unforeseen — refund buffer, urgent legal need, emergency vendor |
| **TOTAL** | **$100,000** | 12-month sustaining budget |

### Scaled-down ($25K — Mozilla MOSS-tier)

Cut marketing, design, research, and contingency. Pure engineering:

| Allocation | Amount |
|---|---|
| Engineering | $20,000 |
| Hosting, AI, data | $3,000 |
| Legal + compliance | $2,000 |
| **TOTAL** | **$25,000** |

### Scaled-up ($500K — Knight Foundation tier)

Add a second engineer, a part-time community manager, a real
marketing budget. See three-year projection below for the shape.

---

## Three-year projection (cumulative)

| Year | Cash burn (annual) | Cumulative cash | Cumulative MAU (target) | Cumulative paying members |
|---|---|---|---|---|
| **Year 0** (now) | $550 | $550 | ~500 | 0 |
| **Year 1** (with $100K grant) | $100K | $100,550 | ~10,000 | 100 ($600/mo from donor tier) |
| **Year 2** (mixed grant + donor + B2B) | $80K | $180,550 | ~50,000 | 1,000 ($6K/mo from donor + $2K/mo institutional) |
| **Year 3** (self-sustaining) | $60K | $240,550 | ~150,000 | 5,000 ($30K/mo from donor + $5K/mo institutional + premium) |

**Year-3 revenue forecast** (matched against year-3 burn):
- Donor tier @ $5/mo avg × 5,000 = **$25,000/month** → $300K/year
- Institutional licenses × 10 × $500/year = **$5,000/year**
- Premium subscriptions @ $9/mo × 1,000 = **$9,000/month** → $108K/year

If anything close to those numbers lands, year 3 is profitable on
operating expense and grant funding becomes optional / additive.

---

## Where the AI cost stays low

Worth calling out explicitly for AI-skeptical funders:

| Cost-reduction layer | Effect |
|---|---|
| **Deterministic state-impact mapper** for 10 high-volume policy areas | Zero AI cost for ~70% of bills (those whose policy area is in the deterministic set) |
| **CRS summary skip** — if Congress.gov already provides a real summary, AI doesn't regenerate one | ~30% output-token reduction per bill analyzed |
| **Prompt caching** on stable system prompts (Anthropic `cache_control: ephemeral`) | 90% off on repeat-call system tokens within 5-minute window |
| **Lazy on-view triggers** — analysis only generates when a user actually scrolls to the summary | Drives cost from "every bill in DB" to "every bill viewed" — ~10× reduction at our scale |
| **30-day staleness check** — re-analyze only if bill status actually changed | Prevents re-billing on every page view |
| **Single source-of-truth `CLAUDE_MODEL` constant** | Easy to drop down to a cheaper model class on a moment's notice |

Combined estimate at 50K MAU: ~$30/month for all AI features. At
500K MAU: ~$200/month. At 5M MAU: ~$1,500/month. The unit economics
remain favorable even at scale.

---

## What we don't budget for (transparency)

- **No marketing spend** beyond conference travel until product-market
  fit is clearer. Word-of-mouth and earned media (especially in
  civic-tech circles) is more credible for our use case anyway.
- **No paid advertising** — politically-adjacent ad targeting is a
  reputational landmine we'd rather avoid even if affordable.
- **No founder salary at market rate** until ~Year 2. The grant funds
  a partial salary so the founder can spend full time on the project;
  proper market-rate compensation arrives once revenue stabilizes.
- **No office space.** Remote.
