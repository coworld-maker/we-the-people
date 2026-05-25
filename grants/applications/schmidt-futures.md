# Schmidt Futures / Schmidt Sciences — Application

**Funder**: Schmidt Futures (schmidtfutures.com) — now also operating as Schmidt Sciences
**Program fit**: Talent + Society → AI-for-public-good civic infrastructure
**Application type**: Highly relationship-driven; no public application form
**Typical award**: Varies widely — from small fellowship-style grants to multi-year strategic partnerships in the $1M+ range
**Submission**: Through warm introduction or via specific program calls

---

## Why Schmidt

- Schmidt Futures funds at the intersection of technology and public good,
  with explicit interest in AI applications that serve democratic
  institutions. Past portfolio includes RAND, Brookings, Stanford HAI.
- They are unusual among major funders in being willing to back
  pre-institutional projects (individuals and small teams), not only
  established nonprofits with track records.
- The Schmidt team values **scalability and replicability**. Open-source
  civic infrastructure that can be forked by other countries or applied
  to other levels of government (state, local) appeals to their portfolio
  thesis.

---

## How to approach Schmidt

Schmidt doesn't accept unsolicited proposals through a portal. The path
to a Schmidt grant goes through:

1. **A warm introduction** from someone in their existing portfolio (a
   former fellow, a current grantee, an advisory board member)
2. **A specific program call** when Schmidt opens one (these are
   announced on schmidtfutures.com/programs and on their LinkedIn)
3. **Conference connections** — Schmidt staff attend RightsCon, AI
   Safety Summit, Aspen Ideas, COMPACT-related events. Pitch in person.

Below is a draft cold-outreach email and a one-pager you can attach
once a warm introduction surfaces.

---

## Cold-outreach email draft (~250 words)

**Subject**: Open-source nonpartisan civic-AI infrastructure — quick intro

Dear [Schmidt staff name],

I'm reaching out because Schmidt Futures' work at the intersection of AI
and public-interest institutions is the closest match I've found for what
we're building — Democracy Unlocked, a free open-source platform that
uses AI to make U.S. Congressional legislation legible to ordinary
citizens.

The platform is live at democracyunlocked.com and open source at
github.com/coworld-maker/we-the-people. Three things may interest you:

1. **The AI is auditable.** All system prompts are public source code,
   under AGPL-3.0. Bias allegations become falsifiable claims, fixable
   via pull request. This is, I believe, the right architecture for
   civic-AI specifically.
2. **The cost economics work.** A four-layer cost-reduction stack
   (deterministic mappers, prompt caching, lazy triggers, staleness
   checks) keeps marginal AI cost under $0.05/month at current scale
   and projected $30/month at 50K MAU.
3. **The model is forkable.** The same architecture can apply to
   state legislatures, parliaments in other democracies, or city
   councils. We've structured the codebase to support derivative work.

We've shipped GDPR + CCPA + 8-state US privacy compliance, ~1,580 bills
synced, and AI-generated summaries auto-triggered on first user view.

Would you have 20 minutes for an exploratory call about whether this
fits a Schmidt program or whether you'd point me toward someone who
might?

Thank you for your time.

Respectfully,
[YOUR NAME]
[EMAIL] · [LINKEDIN]

---

## One-pager attachment

> Pull this from `MASTER_NARRATIVE.md` — the "three-paragraph
> description" + "what we've built" + "team" sections, formatted as
> a single PDF page. Schmidt readers prefer high-density one-pagers
> over long proposals at first contact.

---

## Schmidt-specific positioning

When pitching Schmidt, emphasize these angles:

| Schmidt thesis | Our match |
|---|---|
| "Tech for public good at scale" | Free + open + nonpartisan civic infrastructure that could reach tens of millions of US citizens |
| "AI deployed responsibly" | Public AI prompts; deterministic fallbacks for most use cases; bias-audit commitment |
| "Replicable models" | Open source under AGPL; forkable to state, local, international parallels |
| "Talent + capability building" | Open-source contributor community is itself a civic-tech training ground |
| "Measurable impact" | Built-in transparency dashboard + quarterly reports tied to specific KPIs |

---

## What to ask Schmidt for

Schmidt grants vary enormously. Reasonable asks at different scales:

- **$25K–$50K** — "operating runway to ship the notification system and
  state-legislature integration"
- **$100K–$250K** — "full sustaining grant over 12 months including
  third-party bias audit + civic-education partnerships"
- **$500K+** — "two-year strategic partnership: scale to 50K MAU,
  fork-ready architecture for state legislatures, methodology paper
  on cost-discipline patterns for civic-AI"
- **Talent program slot** — "embed me as a Schmidt fellow for 6 months
  to focus on this full-time while building the open-source community"

The right ask depends on which Schmidt staff/program you connect with;
keep the conversation open until you understand their current priorities.

---

## Pre-submission checklist

- [ ] Identify 3+ people in Schmidt's network who might do an
      introduction (LinkedIn → Schmidt Futures employees + alumni)
- [ ] Polish the one-pager (PDF, real branding) for attachment
- [ ] Have a 3-min walkthrough video ready
- [ ] Be ready to discuss derivative work: how would you fork this
      for, say, the EU Parliament or California state legislature?
- [ ] If you go via a specific program call, tailor everything above
      to the exact language of that program's announcement
