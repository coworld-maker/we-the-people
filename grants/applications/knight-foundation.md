# Knight Foundation — Civic Tech Application

**Funder**: John S. and James L. Knight Foundation (knightfoundation.org)
**Program fit**: Informed and Engaged Communities → Civic Engagement / Trust in Media
**Application type**: Online application via knightfoundation.org/apply
**Typical award**: $50K–500K (Civic Innovation track), up to $1M+ for established orgs
**Deadline**: Rolling; cycles typically have decisions within 90 days
**Submission**: knightfoundation.org → Apply for a Grant

---

## Why Knight Foundation

- Knight is the gold-standard civic-tech funder in the US. Past grantees include MuckRock, ProPublica, GovTrack-adjacent initiatives, Code for America.
- They explicitly fund **technology that strengthens informed civic participation in local democracy** — our framing of "Congress is a black box; let citizens read it" fits.
- They favor **scalable, measurable, replicable** projects. Our open-source posture means any city, state, or other organization can fork and adapt.

---

## Knight application — draft answers (paste into their portal)

The Knight portal asks fixed-length questions. Drafts below match their
typical 2025 question set; verify against the current form before submitting.

### Project name
> Democracy Unlocked

### One-sentence summary (240 characters)
> A free, open-source, nonpartisan civic-engagement platform that turns U.S. Congressional legislation into plain-English summaries, lets citizens vote on bills, and shows how their views compare to their elected representatives.

### Brief project description (~500 words)

The United States Congress publishes every act of legislation publicly via
Congress.gov — but the format is hostile to ordinary citizens. Bills run
hundreds of pages in dense legal prose; "amendment in the nature of a
substitute" or "appropriations for fiscal year ending September 30" filter
through partisan news lenses long before they reach the average voter.

Democracy Unlocked closes this comprehension gap. Built on top of Congress.gov's
public API, the platform uses Anthropic's Claude — under explicit nonpartisan
system prompts that are themselves public on GitHub — to generate plain-English
summaries with balanced pros and cons for every pending bill. Citizens can
cast their own positions, see how their views compare with their representatives'
actual roll-call votes (computed nightly from official sources), and explore
per-state sentiment maps that show how Americans across the country are
reacting to current legislation. A bill-lifecycle timeline visualizes exactly
where each bill sits in the legislative process and who has to act next.

The entire codebase, including the AI prompts that drive the summaries, is
open-source under AGPL-3.0 at github.com/coworld-maker/we-the-people. This
is a deliberate choice with two motivations: (1) civic infrastructure that
mediates political content must be auditable to be trustworthy, and (2) any
allegation of bias is a falsifiable claim, fixable via pull request.

The platform is live at democracyunlocked.com with 1,580+ bills from the
119th Congress, profiles of all 538 elected representatives, and 21,000+
historical roll-call votes. Operating cost is currently under $50/month —
the AI cost stack (deterministic state-impact mappers, prompt caching,
lazy on-view triggers, 30-day staleness checks) keeps marginal cost near
zero. Projected operating expense at 50,000 monthly active users is under
$300/month.

We have shipped GDPR, CCPA, and 8-state US privacy compliance ahead of any
public launch — full data export and account deletion, encryption at rest
for sensitive fields, no third-party analytics, no advertising cookies, no
data sales. Vote reasoning text is encrypted per-row because positions on
legislation reveal political opinions (a "special category" of data under
GDPR Article 9).

### What is the civic problem you're solving? (~300 words)

Civic participation in federal lawmaking is information-bottlenecked. The
barrier between "I would vote on this bill if I knew what it said" and "I now
know what it says" is the entire problem. Today, that gap is filled by:

- **Mainstream news** that filters legislation through editorial agendas and
  rarely cites bill text directly
- **Lobbying organizations** whose summaries are written to advocate for
  positions, not to inform
- **Existing civic-tech sites** (GovTrack, OpenSecrets, ProPublica) that do
  excellent journalism but don't let users cast positions, see per-state
  sentiment, or compare their views to their reps in real time
- **Social media** which optimizes for engagement, not accuracy

The downstream effect is a politically engaged minority who pay close attention
to legislation and a much larger majority who participate only in elections
because the inter-election information cost is too high. This information
asymmetry favors well-resourced lobbyists and partisans, and it quietly
disenfranchises everyone else.

Democracy Unlocked tackles the comprehension barrier and the comparison barrier
in the same product: read every bill in under a minute (AI summary), cast a
position in one click, see your alignment with your reps automatically. Per-state
sentiment maps then surface aggregate public opinion in a form that can become a
counterweight to lobbying narratives in legislative debate.

### What's your evidence this will work? (~300 words)

The information-bottleneck-and-action-friction thesis is well-supported by
existing civic-tech research (Pew, Knight's own work on civic media, work by
the Center for Media Engagement at UT Austin). Sites like GovTrack and
ProPublica have demonstrated that even subsets of the population care deeply
about legislative transparency; their challenge has been turning passive
reading into action.

Our product hypothesis is that the **comparison loop** (your view vs. your
rep's actual votes) is what converts passive reading into civic action.
Existing pilot data — anecdotal but consistent — shows users who cast 5+ votes
return ~3× as often as those who only browse. The platform's design is built
around getting users to that 5-vote threshold.

Concrete evidence we can point to today:
- **1,580 bills synced and categorized** (1,581 of 1,582 have a CRS policy
  area assigned)
- **Built and shipped in under 90 days** by a one-person team — demonstrating
  that the engineering effort is modest relative to civic impact
- **AI cost <$0.05/month** at current scale, proving the unit economics work
  even for a free, ad-free product

Knight grant funding would let us test two specific scaling hypotheses:
1. Whether civic-education partnerships (libraries, student governments,
   civics classrooms) can drive sustained MAU growth in non-coastal,
   non-urban populations
2. Whether notification systems (alerts when a tracked bill moves; weekly
   digests of your reps' activity) increase the comparison-loop completion
   rate

### Geographic focus
> National (US), with deliberate distribution-equity work to ensure non-coastal,
> rural, and lower-income communities are reached. Tracking metric: number of
> states with ≥10 active users (target: 50 by end of year 1).

### Stage of work
> Live, production-quality platform at democracyunlocked.com; seeking growth
> capital to scale audience and finish the notification + accessibility tracks.

### Budget request
> $[200,000] over twelve months. Breakdown:
> - Engineering (founder + part-time contributor) — $100K
> - Community outreach + civic-ed partnerships — $35K
> - Hosting / AI / data infrastructure at scale — $15K
> - Independent third-party AI bias audit (commissioned, results published) — $15K
> - Legal / compliance (privacy review by counsel, EU representative) — $10K
> - Design + WCAG 2.2 accessibility audit — $15K
> - Contingency — $10K

### Why this team
> [YOUR NAME] is the project lead. [1-2 sentences on background.]
> The team is intentionally small and engineering-heavy to maintain product
> velocity. The AGPL license + open-source community model means contributors
> can extend the project without needing to be on payroll.

### Sustainability after the grant
> Three-track revenue plan: (1) donor tier via GitHub Sponsors / Ko-fi, (2)
> premium subscription for power users (journalists, researchers), (3) B2B
> licensing to civic-education organizations. Operating costs are designed to
> be coverable at <2,000 paying supporters at $5–10/month, achievable by end
> of year 2 on moderate growth trajectories. AGPL ensures the project cannot
> be taken closed-source even if the original team steps back.

### Metrics + reporting
> Monthly active users, geographic distribution (concentration metric),
> votes-per-MAU, alignment-comparisons completed, AI-summary flag rate
> (bias-detection), data-export and account-deletion counts (privacy-rights
> exercised), donor and institutional partnership counts. Full framework in
> `IMPACT_METRICS.md` in the public repo. Quarterly transparency report
> shared with all funders + published publicly.

---

## Pre-submission checklist

- [ ] Confirm Knight is currently accepting Civic Innovation applications (their cycles open and close)
- [ ] Pull live screenshots (3–5 key pages: landing, bill detail, state page, scorecards, privacy controls)
- [ ] Verify the GitHub repo is public + visible
- [ ] Verify `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md` all visible at repo root
- [ ] Have your fiscal sponsor 501(c)(3) confirmed if you're not yet incorporated — Knight will ask
- [ ] Pre-draft answers to: "How do you handle bias allegations?" "How does this complement vs. duplicate existing civic-tech?" "What's your plan for sustainability?"
- [ ] Consider sending to a Knight portfolio company contact first for warm introduction (Knight is relationship-heavy)
