# Democracy Fund — Letter of Inquiry

**Funder**: Democracy Fund (democracyfund.org)
**Program fit**: Healthy Democracy → Governance / Civic Infrastructure
**Application type**: LOI (Letter of Inquiry, 2–3 pages). Invited full proposal if interested.
**Typical award**: $50K–500K for one-year operating
**Deadline**: Rolling — they accept LOIs year-round
**Submission**: democracyfund.org → Grants → How We Fund → Submit Inquiry

---

## Why Democracy Fund

- Their stated focus on healthy democracy + civic-infrastructure + nonpartisanship maps directly onto what we do.
- They explicitly fund open-source civic infrastructure (past grantees include OpenGov Hub, GovTrack predecessor work, ProPublica).
- They care about responsible AI in democracy — Democracy Unlocked's public-prompt + nonpartisan-by-design model is a positive case study.

---

## Letter of Inquiry — draft (paste-ready, ~2 pages)

> [TODO before sending: replace bracketed placeholders, get on letterhead if formalized as nonprofit, sign + date]

---

[YOUR NAME]
[ADDRESS]
[EMAIL] · [PHONE]

[DATE]

Joe Goldman, President *(verify current program officer name — democracyfund.org/team)*
Democracy Fund
1200 17th Street NW, Suite 300
Washington, DC 20036

**RE: Letter of Inquiry — Democracy Unlocked (civic infrastructure)**

Dear [Program Officer name],

I am writing to introduce Democracy Unlocked, a free, open-source, nonpartisan
civic-engagement platform that I believe aligns directly with the Healthy
Democracy program's investment in pluralism, transparency, and good governance.

**The problem we address.** Most Americans want to participate meaningfully in
federal lawmaking but face a wall of inaccessible information: thousand-page
bills in legalese, news coverage filtered through partisan lenses, and "civic
engagement" tools that either push agendas or monetize user data. The result
is an information asymmetry that quietly disenfranchises everyone outside the
political class.

**What we built.** Democracy Unlocked pulls every bill before Congress directly
from Congress.gov, uses Anthropic's Claude — under nonpartisan system prompts
that are themselves public on GitHub — to generate plain-English summaries with
balanced pros and cons, lets users cast their own positions, and surfaces
per-state citizen sentiment maps so people can see how their neighbors are
reacting. A bill-lifecycle timeline shows where each piece of legislation sits
in the lawmaking process and who has to act next. Live at
**democracyunlocked.com**.

The platform is open source under the AGPL-3.0 license. The AI prompts,
ranking methodology, encryption choices, and full source are auditable at
**github.com/coworld-maker/we-the-people**. Bias claims are testable; fixes
are pull requests. There is no black box.

**Current state.** The site is live with 1,580+ bills from the 119th Congress,
profiles of all 538 elected representatives, ~21,000 historical roll-call
votes, AI-generated bill summaries, and a national party-makeup map. We have
shipped GDPR, CCPA, and 8-state US privacy compliance ahead of any public
launch. Operating cost is currently under $50/month thanks to a four-layer
AI cost-reduction stack (deterministic state-impact mappers, prompt caching,
lazy on-view triggers, and a 30-day staleness check); projected operating
cost at 50,000 monthly active users is under $300/month.

**What funding from Democracy Fund would do.** Over twelve months, $[100,000]
in operating support would underwrite:

1. **Engineering capacity** to ship the notification system, mobile-native
   app, state-legislature integration, and WCAG 2.2 accessibility audit
2. **Civic-education partnerships** with 5–10 organizations (libraries,
   student governments, civics teachers) to embed the tool in existing
   institutional touchpoints — especially in non-coastal, lower-income, and
   first-generation-voter populations
3. **A third-party bias audit** of the AI summarization layer by a
   credentialed civic organization, with results published openly
4. **Privacy policy + DPA review by qualified counsel** ahead of EU launch

**Why this is sustainable.** I have a three-track sustainability plan
(donor tier via GitHub Sponsors/Ko-fi, premium subscription for power
users like journalists, B2B licensing for civic-education organizations).
Operating expenses are designed to be coverable at <2,000 paying
supporters at $5–10/month, which is achievable by end of year 2 if
growth tracks moderate civic-tech projections. The AGPL license ensures
that even if my involvement ends, no commercial fork can take the
project closed-source — the community can sustain it indefinitely.

**Theory of change.** Civic participation is information-bottlenecked.
The barrier between "I'd vote on this bill if I knew what it said" and
"I now know what it says" is the entire problem. Lower that barrier and
engagement follows. As citizens engage, transparent public-opinion data
becomes a counterweight to lobbyist-driven narratives in legislative
debates. This is the GovTrack/ProPublica/OpenSecrets playbook extended
into the modern AI era and rebuilt for the mobile/PWA generation.

I would welcome a 20-minute call to discuss whether Democracy Unlocked
fits the Healthy Democracy program's current priorities, and what a
full proposal might look like. I am happy to provide a live demo,
access to anonymized usage data, or any additional materials.

Thank you for your consideration.

Respectfully,

[YOUR NAME]
Founder, Democracy Unlocked

---

**Attachments referenced** (deliver as separate PDFs if requested):
1. Master narrative (1-pager extracted from `MASTER_NARRATIVE.md`)
2. 12-month budget (from `BUDGET.md`)
3. Impact-metrics framework (`IMPACT_METRICS.md`)
4. Live-site walkthrough screenshots
5. GitHub repository link
6. Resume / bio for project lead

---

## Pre-submission checklist

- [ ] Replace all `[BRACKETED]` placeholders
- [ ] Verify current program officer name (sometimes changes; check democracyfund.org/team)
- [ ] Set up `privacy@`, `legal@`, and `security@` mailboxes — referenced in legal docs Democracy Fund may check
- [ ] Get the site to 99%+ uptime on Vercel for at least 30 days before sending (they will check)
- [ ] Pre-publish the public transparency dashboard at `/transparency` so they can see real metrics
- [ ] Have the AGPL `LICENSE` file visible at the GitHub repo root (already done ✓)
- [ ] Spell-check the final letter — Democracy Fund's program staff are precise readers

## Likely follow-up questions to prepare answers for

- "Who is on your team / who's the institutional sponsor?" — be ready to name a 501(c)(3) fiscal sponsor if you're not yet a nonprofit (Open Collective + Open Source Collective is the fastest path)
- "How do you handle bias allegations?" — prompt transparency, in-app flag-for-review, planned third-party audit, public response
- "What's your relationship to existing platforms (GovTrack, ProPublica, OpenSecrets)?" — complementary; we don't duplicate their journalism, they don't do per-citizen voting + alignment
- "How do you prevent vote manipulation / botting?" — Clerk auth (one account per verified email), rate limiting, audit logs, planned identity-verification tier
- "Why open source?" — credibility, longevity, alignment with civic mission, eligibility for grant funding (this one)
- "Will you build a 501(c)(3)?" — depends on funder requirements; ready to convert if needed, fiscal sponsor available in the meantime
