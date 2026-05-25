# Mozilla Open Source Support (MOSS) — Application

**Funder**: Mozilla Foundation (foundation.mozilla.org)
**Program fit**: MOSS → Mission Partners track (open-source projects supporting an open internet / digital rights)
**Application type**: Online application via foundation.mozilla.org/moss
**Typical award**: $5K–$50K (Foundational tier), up to $250K for larger Mission Partners awards
**Deadline**: Rolling; review committee meets ~quarterly
**Submission**: foundation.mozilla.org/moss → Apply

---

## Why Mozilla MOSS

- Mozilla funds open-source projects that protect or advance the open
  internet. Civic infrastructure built on AGPL fits squarely in their
  "Mission Partners" category.
- The reviewers care deeply about license choice. AGPL is unusually well-suited
  to Mozilla's worldview — it preserves the open-source character even if a
  for-profit fork emerges.
- Mozilla's MOSS history includes funding for Open Whisper Systems (Signal),
  Tor, Let's Encrypt — they're comfortable funding civic-infrastructure work
  that doesn't fit the typical "startup" or "nonprofit-only" mold.

---

## MOSS application — draft answers

The MOSS portal asks fixed questions. Drafts below match their typical
question set; verify against the current form.

### Project name
> Democracy Unlocked

### Project URL
> https://www.democracyunlocked.com

### Source code URL
> https://github.com/coworld-maker/we-the-people

### License
> GNU Affero General Public License v3.0 (AGPL-3.0)

### What problem does the project solve? (~400 words)

The U.S. federal legislative process is a public-information system that
fails as a public-information system. Congress.gov publishes every bill,
every member's roll-call vote, every committee referral — but the format
is hostile to anyone who isn't already a policy professional. Most
"civic engagement" software that purports to solve this problem either
(a) pushes a partisan agenda, (b) monetizes user data to political
campaigns, or (c) lives behind a paywall. The result is an information
asymmetry that favors well-resourced lobbyists and partisans, and
quietly disenfranchises the general public.

Democracy Unlocked is open-source civic infrastructure built to close
that gap. It pulls every pending bill from Congress.gov, uses AI
(Anthropic Claude) under nonpartisan system prompts that are themselves
public on GitHub to generate plain-English summaries, lets citizens
cast their own positions, and shows how their views align with their
elected representatives' actual votes. The platform is licensed
AGPL-3.0 to ensure that any commercial fork must also be open-source —
preserving the civic-infrastructure character of the project in
perpetuity.

The technical bet is that open source is the right architecture for
civic-AI systems specifically. When an AI system summarizes politically
sensitive content, the only credible way to address bias allegations is
to make the system inspectable. Our AI prompts, ranking methodologies,
encryption choices, and data pipelines are visible in the repo. Bias
allegations become falsifiable; fixes become pull requests; the project
gains community-level legitimacy that closed alternatives cannot match.

Beyond the AI layer, Democracy Unlocked solves practical open-source
civic-infrastructure problems:
- Reproducible nightly sync from Congress.gov v3 API
- A deterministic state-impact mapping system (10 high-volume policy areas
  covered with rule-based logic; AI fallback for the long tail) — keeps
  AI cost under $50/month at production scale
- Full GDPR + CCPA + 8-state US privacy compliance, including encrypted
  email/ZIP storage, one-way IP hashing in audit logs, and user-exercisable
  data export + account deletion
- Standalone PWA installable on mobile home screens (no app-store gatekeeping)

These components are individually useful and intentionally modular —
forks could lift the AI-cost-reduction stack, the privacy-compliance
patterns, or the data-pipeline architecture into adjacent civic-tech
projects (state legislatures, local government, international parallels).

### What's the open-source community status? (~250 words)

The repository was made public on [DATE] under AGPL-3.0. As of this
application, all source code, prompts, schemas, and migration history
are public on GitHub. The repo includes:

- Comprehensive `README.md` with project overview, screenshots, and
  quickstart
- `CONTRIBUTING.md` with PR + issue workflow
- `SECURITY.md` with responsible disclosure process
- `docs/` with architecture overview, ops runbook, and rolling dev log
- GitHub issue + PR templates including a "nonpartisanship check"
- Secret scanning, Dependabot, and CodeQL enabled

The community is at an early stage — we don't yet have a long list of
external contributors to point to. We have intentionally structured the
project to make external contribution low-friction: well-commented
code, an architecture document tailored to onboarding in <1 day, and
explicit invitations to flag bias or factual errors via GitHub issues.

MOSS funding would underwrite a focused community-building push:
documented "good first issues" for new contributors, a contributor
onboarding session series, and active maintainership of pull requests
within 72 hours. We believe civic-tech open source is undersupplied with
maintainership capacity, and our limited grant request reflects that
maintenance ≠ scale ambition.

### What would Mozilla MOSS funding enable? (~250 words)

A $[25,000] MOSS Foundational award over 6–12 months would fund:

1. **Engineering capacity (~$18K)** to ship the highest-priority items
   on the public roadmap:
   - Notifications system (email + in-app alerts when tracked bills move)
   - WCAG 2.2 accessibility audit + remediation
   - The multi-row INSERT performance refactor that lets the bill-sync
     pipeline handle the full 119th Congress backlog without manual
     intervention
2. **Hosting + AI + data infrastructure (~$3K)** at the scale the
   above features unlock
3. **Independent third-party AI bias audit (~$3K)** by a credentialed
   civic organization, with results published openly under the same
   AGPL license as the codebase
4. **Documentation + onboarding investment (~$1K)** to convert the
   existing docs/ folder into a contributor guide that genuinely lets
   a new developer land their first PR in their first session

Mozilla's involvement signals to the broader open-source civic-tech
community that this work is worth contributing to. The downstream
effect — community contributions, partner organizations adopting the
project, third-party forks for state legislatures or international
parallels — is the long-tail return on what is, on paper, a modest
direct investment.

### How will success be measured?

| Metric | Target by month 12 |
|---|---|
| External contributors (PRs merged from non-team accounts) | ≥ 10 |
| GitHub stars | ≥ 500 |
| Forks deployed independently (verifiable via referrer) | ≥ 2 |
| Documentation onboarding test (cold contributor → first PR) | < 1 day |
| Site uptime | > 99.5% |
| AI bias audit report | Published openly, results addressed |

All metrics will be reported quarterly via the same transparency
dashboard available publicly at /transparency on the live site.

### Why AGPL specifically? (Mozilla cares about license rationale)

AGPL is the right license for civic infrastructure for three reasons:

1. **It preserves the open-source character permanently** — any
   commercial fork or SaaS deployment of a modified version must
   themselves be open-source, preventing the "open-source rug pull"
   pattern that has affected Elasticsearch, Redis, MongoDB, et al.
2. **It aligns license incentive with mission.** A closed-source
   civic-AI product is worse for democracy than no product. AGPL
   structurally forecloses that outcome.
3. **It signals seriousness to the open-source community.** AGPL is
   often used by projects that take their copyleft commitments
   seriously (Plausible, Mastodon, Element/Matrix). It's a clear
   declaration of intent.

We considered MIT and Apache 2.0, but both permit the "open-source
prelude to a closed-source product" pattern that we explicitly want
to prevent in civic infrastructure.

---

## Pre-submission checklist

- [ ] Confirm MOSS currently accepting Mission Partners applications
- [ ] Verify GitHub repo public + license visible at root
- [ ] Verify `docs/` and `CONTRIBUTING.md` are well-organized
- [ ] Pre-write tagged "good first issues" in GitHub before applying — reviewers may look
- [ ] Have a 3-min screencast walkthrough ready (Mozilla reviewers appreciate them)
- [ ] Be ready to articulate why AGPL specifically — they ask
