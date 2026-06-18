# Democracy Unlocked&trade;

> Read real legislation. Cast your vote. See how your views compare to Congress.
> Powered by AI and official data from Congress.gov.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Built with Next.js](https://img.shields.io/badge/Built_with-Next.js_15-black)](https://nextjs.org/)
[![Status: pre-launch](https://img.shields.io/badge/Status-pre--launch-orange)]()

**Live site**: https://www.democracyunlocked.com

Democracy Unlocked is a free, nonpartisan civic engagement platform. It pulls live
data from Congress.gov, lets US citizens vote on real pending legislation, generates
AI summaries of bills with balanced pros and cons, and shows users how their views
compare to their elected representatives' actual roll-call votes.

It's open source because civic infrastructure should be auditable. Anyone can read
the AI prompt instructions, the deterministic state-impact mappings, the encryption
choices, and the data pipelines — there's no black box behind the analysis.

---

## What's inside

| Feature | Status |
|---|---|
| Browse + filter all current Congressional bills | ✅ Live |
| AI-generated plain-English bill summaries (Claude Haiku) | ✅ Live (auto-fire, cost-optimized) |
| Cast votes on bills + see your voting history | ✅ Live |
| Per-bill discussion threads | ✅ Live |
| 6-step legislative timeline ("where is this bill?") | ✅ Live |
| State-level citizen sentiment map per bill | ✅ Live |
| AI-generated per-state impact heatmap (deterministic for top 10 policy areas, AI for the rest) | ✅ Live |
| Per-state pages with AI digest, policy-area pie, delegation breakdown | ✅ Live |
| Representative scorecards with vote-by-vote alignment | ✅ Live |
| Member-vs-state-constituency alignment scoring | ✅ Live |
| National party-makeup map | ✅ Live |
| OpenStates state-legislature integration | ✅ Live (gated on `OPENSTATES_API_KEY`) |
| GDPR / CCPA-compliant data rights (export, deletion) | ✅ Live |
| PWA — installable on Android / iOS | ✅ Live |
| Email notifications | ⬜ Planned |
| Donor tier (GitHub Sponsors / Ko-fi) | ⬜ Planned |

---

## Tech stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind 3 + CSS variables (patriotic palette)
- **Auth**: Clerk
- **Database**: Supabase Postgres + Prisma 7
- **AI**: Anthropic Claude Haiku
- **Maps**: `d3-geo` + `topojson-client` + `us-atlas`
- **Hosting**: Vercel

---

## Quick start

```bash
# Clone
git clone https://github.com/coworld-maker/we-the-people
cd we-the-people

# Install
npm install   # postinstall runs `prisma generate`

# Configure
# Create .env.local with at minimum:
#   DATABASE_URL=...           (Supabase Postgres)
#   CLERK_PUBLISHABLE_KEY=...
#   CLERK_SECRET_KEY=...
#   CONGRESS_API_KEY=...       (free at api.data.gov)
#   CRON_SECRET=...            (any random string)
#   ANTHROPIC_API_KEY=...      (Claude API)
# Optional:
#   OPENSTATES_API_KEY=...     (state legislature feature)
#   NEXT_PUBLIC_FEEDBACK_URL=... (community-poll link)

# Run
npm run dev   # http://localhost:3000
```

For a deeper dive — local DB setup, syncs, deploys, troubleshooting — see
[`docs/RUNBOOK.md`](./docs/RUNBOOK.md).

---

## Documentation

Five living documents in [`docs/`](./docs):

- **[STATUS.md](./docs/STATUS.md)** — current snapshot: env vars, DB counts, action items, known issues
- **[DEVLOG.md](./docs/DEVLOG.md)** — reverse-chronological log of meaningful work + the reasoning behind it
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — system overview for new contributors (~15 min read)
- **[RUNBOOK.md](./docs/RUNBOOK.md)** — ops cheatsheet: local setup, deploys, syncs, troubleshooting
- **[Community-Feature-Poll.docx](./docs/Community-Feature-Poll.docx)** — survey content for the Microsoft Form

If anything in those docs is unclear or stale, please open an issue or PR — that's
exactly what we want.

---

## Contributing

We welcome contributions of all kinds:

- 🐛 **Bug reports** — open an issue with steps to reproduce
- ✨ **Feature ideas** — open an issue (or vote on existing ones); see also the [community feature poll](./docs/Community-Feature-Poll.docx)
- 📝 **Documentation** — fixes to typos, clarifications, examples
- 🔬 **Domain expertise** — especially welcome for the per-policy-area state weights in [`lib/data/state-impact-weights.ts`](./lib/data/state-impact-weights.ts); the values are public-domain heuristics that benefit from subject-matter review
- 💻 **Code** — read [CONTRIBUTING.md](./CONTRIBUTING.md), pick an issue tagged `good first issue` or propose something new

By participating you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Security

If you discover a vulnerability, **please do not open a public issue.**

Email `security@democracyunlocked.com` with the details. See [SECURITY.md](./SECURITY.md)
for the full disclosure policy. We aim to acknowledge within 48 hours and ship a fix
within 30 days for high-severity issues.

---

## License

[AGPL-3.0](./LICENSE). You're free to run, copy, modify, and redistribute this
software, but:

- Modifications must remain under AGPL-3.0
- If you run a modified version as a network service (e.g. host your own fork as
  a SaaS), you must make your modifications available to your users

This license preserves the open-source character of civic infrastructure: anyone
can fork and improve, but no one can take this work proprietary while still
benefiting from community contributions.

---

## Trademarks

The **AGPL-3.0 license covers the source code only** — it does **not** grant any
rights to the Democracy Unlocked name or brand.

"**Democracy Unlocked**"&trade;, the Democracy Unlocked logo, and associated
wordmarks and design marks are trademarks of Democracy Unlocked (common-law
marks; not yet USPTO-registered). All rights reserved.

If you fork or self-host this software under the AGPL, you **must**:

- Remove or replace the Democracy Unlocked name, logo, and wordmarks with your own branding
- Not present your deployment in a way that implies affiliation with, or endorsement by, Democracy Unlocked

Nominative references (e.g. "based on Democracy Unlocked") are fine. Trademark
rights are separate from and not waived by the open-source code license.

---

## Acknowledgments

- **Congress.gov** — bills, members, roll-call votes
- **OpenStates** — state legislature data
- **us-atlas** — state-level TopoJSON geometry
- **Jeffrey B. Lewis** (UCLA) — historical congressional district boundaries (CC0)
- **Anthropic** — Claude API for AI analysis
- **Clerk, Supabase, Vercel** — infrastructure
- **The civic-tech community** — for proving that public-interest software can ship

---

<sub>Not affiliated with the U.S. Government or any political party.</sub>
