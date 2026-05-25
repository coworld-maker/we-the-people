# Grants

Working folder for funding applications. Strategy: write strong reusable
core materials once, then tailor a short pitch per funder.

## Files

| Doc | Purpose |
|---|---|
| [`MASTER_NARRATIVE.md`](./MASTER_NARRATIVE.md) | The reusable core — mission, theory of change, technical approach, team, sustainability. Most application sections can be assembled from this. |
| [`BUDGET.md`](./BUDGET.md) | First-year operating budget, three-year projection, vendor breakdown |
| [`IMPACT_METRICS.md`](./IMPACT_METRICS.md) | What we'll measure and how — KPIs, evaluation methodology |
| [`applications/`](./applications/) | Per-funder drafts (see below) |

## Target funders

Ranked roughly by fit + likelihood:

| Funder | Best fit / amount | Status | File |
|---|---|---|---|
| **Democracy Fund** | Healthy democracy / civic infrastructure — $50K–500K typical | 📝 Draft | [`applications/democracy-fund-loi.md`](./applications/democracy-fund-loi.md) |
| **Knight Foundation** | Civic engagement + journalism — $50K–500K | 📝 Draft | [`applications/knight-foundation.md`](./applications/knight-foundation.md) |
| **Mozilla Open Source Awards (MOSS)** | Open-source infrastructure — $5K–50K | 📝 Draft | [`applications/mozilla-moss.md`](./applications/mozilla-moss.md) |
| **Patrick J. McGovern Foundation** | AI-for-good — $100K–500K | 📝 Draft | [`applications/mcgovern.md`](./applications/mcgovern.md) |
| **Schmidt Futures** | Tech-for-public-good — varies | 📝 Draft | [`applications/schmidt-futures.md`](./applications/schmidt-futures.md) |
| **Hewlett Foundation — Madison Initiative** | Democratic norms — $100K–250K | 🟡 Not invited yet — relationship-build first | — |
| **Ford Foundation — Democracy program** | Democratic engagement — $100K–500K | 🟡 Long timeline | — |
| **Carnegie Corporation — Democracy and Civic Engagement** | $100K–500K | 🟡 Relationship-required | — |
| **MacArthur Foundation** | Broad civic — typically $250K+ | 🟡 Invited proposals only | — |
| **NEH Digital Humanities Advancement Grants** | Civic education tech — $50K–350K | 🟡 Match the "civic education" angle | — |

## Workflow

1. **Customize `MASTER_NARRATIVE.md`** — fill in `[YOUR NAME]`, `[ADDRESS]`,
   team bios, any specific numbers you want quoted. This is the source of
   truth — every application pulls from it.
2. **Pick the top 1–2 funders** for your first push. Recommend Democracy
   Fund + Mozilla MOSS in parallel — totally different cycles, totally
   different stakes, fast feedback loop on whether the narrative resonates.
3. **Update each application** with the customized text and submit.
4. **Track status** in this table. Add new funders as you discover them.

## Tips that apply across all funders

- **Show the live site** in every application. They can click and see what they're funding before they read the budget.
- **Quantify what you can.** "1,580 bills, 538 representatives, AI cost <$0.05/month at current scale" beats "we're efficient."
- **Don't oversell.** Most program officers can smell aspirational metrics. Stick to what's true.
- **Open-source matters** — for Mozilla, Democracy Fund, Knight, and Ford especially. The AGPL choice is a feature, lead with it.
- **Nonpartisanship matters.** Every funder above is sensitive to perceived bias in election-adjacent work. The system-prompt-in-public-source-code argument is unusually strong here.
- **Sustainability matters.** "How will you keep going after our money runs out?" is the #1 program-officer question. Have an answer. The donor + community + B2B path in `MASTER_NARRATIVE.md` is the spine of mine.
