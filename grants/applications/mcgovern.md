# Patrick J. McGovern Foundation — Application

**Funder**: Patrick J. McGovern Foundation (mcgovern.org)
**Program fit**: Data & Society / AI for Good → Civic-tech AI applications
**Application type**: Letter of interest first; full proposal by invitation
**Typical award**: $100K–$500K, sometimes larger for multi-year strategic partnerships
**Deadline**: Rolling
**Submission**: mcgovern.org → Contact (no public application portal; relationship-driven)

---

## Why McGovern

- The McGovern Foundation funds "AI applied to advance human progress." Civic AI
  is squarely in scope — they have funded ProPublica's machine-learning work,
  Stanford's RegLab, and several civic-data initiatives.
- They explicitly value **trustworthy AI in public-interest applications**.
  Our public-prompts + nonpartisan-by-design + auditable architecture is
  the kind of AI deployment they want more of in the world.
- They're a relatively rare US grantmaker willing to underwrite AI inference
  cost as a line item — most foundations are wary, McGovern is not.

---

## Letter of Interest — draft (~1 page)

[YOUR NAME]
[ADDRESS]
[EMAIL] · [PHONE]

[DATE]

Vilas Dhar, President *(verify at mcgovern.org/team)*
Patrick J. McGovern Foundation
[ADDRESS]

**RE: Letter of Interest — Democracy Unlocked: Trustworthy AI for Civic
Engagement**

Dear [Program Officer name],

I am writing to introduce Democracy Unlocked — a free, open-source civic
platform that uses AI to make the U.S. Congress legible to ordinary citizens
— and to explore whether it aligns with the Patrick J. McGovern Foundation's
Data & Society priorities.

**The problem we address.** Federal legislation is published openly via
Congress.gov, but the format defeats most citizens: thousand-page bills in
legalese, with mainstream news coverage filtered through partisan lenses.
The result is a comprehension gap that effectively disenfranchises
non-specialists in their own government. AI can close that gap, but only if
it is deployed in a way that earns and maintains public trust — a problem
the broader civic-AI space has handled inconsistently.

**Our approach.** Democracy Unlocked (live at democracyunlocked.com)
applies Anthropic's Claude Haiku under explicit nonpartisan system prompts
to generate plain-English summaries of every pending bill, with balanced
pros and cons. The full system — prompts, ranking algorithms, encryption
choices, data pipelines — is open source under AGPL-3.0 at
github.com/coworld-maker/we-the-people. Bias allegations become falsifiable
claims fixable via pull request. There is no black box.

We have engineered an unusually disciplined AI cost stack:
deterministic mappers handle the top 10 policy areas without AI calls;
prompt caching, lazy on-view triggers, and a 30-day staleness check
together keep total AI cost under $0.05/month at current scale and
projected to ~$30/month at 50,000 monthly active users. The unit
economics make it possible to keep the product free indefinitely.

**Why this fits McGovern's portfolio.** McGovern's stated commitment to
trustworthy AI in public-interest applications maps directly onto what
we've built and how we operate:

1. **Audit ability through open source** — the AI prompts and ranking
   methodology are publicly readable
2. **Bias transparency** — every AI summary will surface an in-app
   flag-for-review button (planned), with all flags published in a
   quarterly transparency report
3. **Cost discipline** — the multi-layer cost stack is itself a
   contribution to the civic-AI commons; the patterns are reusable by
   other civic-tech projects
4. **Privacy by construction** — GDPR + CCPA + 8-state US compliance
   already shipped, with encryption at rest for politically-sensitive
   fields and one-way IP hashing in audit logs

**What we would propose.** A $[200,000] grant over 18–24 months would
fund: (a) engineering capacity to ship the notification system, mobile
PWA work, and state-legislature integration; (b) commissioning an
independent third-party AI bias audit by a credentialed civic
organization; (c) publishing a methodology paper on the cost-reduction
stack so other civic-AI projects can adopt the same patterns; (d) a
small grant program for derivative forks (state and international
parallels). The platform's underlying open-source posture multiplies
the return on any specific grant — investment in our core codebase
benefits every fork.

I would welcome a 20-minute conversation to explore alignment with the
Foundation's current portfolio priorities, and would be glad to provide
a live demo, repository walkthrough, anonymized usage data, or any
additional materials.

Thank you for your consideration.

Respectfully,

[YOUR NAME]
Founder, Democracy Unlocked

---

## Likely follow-up questions

- "What's your relationship to existing civic-AI work (Stanford RegLab, etc.)?" — complementary; they research AI in regulatory settings, we deploy it to citizens
- "How do you handle AI hallucinations on consequential information?" — every AI summary is paired with the official CRS summary as a fallback + a "flag for review" affordance + a link to the original bill text
- "Will you publish the bias-audit results?" — yes, openly, under the same AGPL as the codebase
- "Is this a 501(c)(3)?" — [if not yet, fiscal sponsor via Open Source Collective]
