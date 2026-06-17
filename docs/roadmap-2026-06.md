# Roadmap — post-competitive-analysis (June 2026)

Derived from the competitive analysis ([competitive-analysis-2026-06.md](../competitive-analysis-2026-06.md))
and the council session on three proposed additions. Strategic thesis: **stop
investing in the commoditized middle (AI summary + rep votes + contact — now
table stakes across CivicAlign, BillBoard, How Congress Votes, Better Congress);
double down on the moat the clones structurally lack — community + accountability.**

## Council verdicts on proposed additions

| # | Addition | Verdict | Scope decision |
|---|---|---|---|
| 1 | Share to social media | ✅ Yes | **Outbound share only** (prefilled intent URLs, user taps post). No auto-posting on the user's behalf (OAuth/standing-permission liability). |
| 2 | Usernames + moderation | ✅ Yes, soon | Pseudonymity raises discussion participation; moderation rails (report/block/rate-limit/escalation) are required infra regardless. |
| 3 | Bipartisan news feed | ⚠️ Conditional yes | **Per-bill, source-labeled, balanced** — articles attached to specific bills, not a curated "top stories" surface. Bias liability lives in curation, so don't curate: attach + label. |
| 4 | Live chat | ⏸️ Deferred → now bundled with #2 | Hard gate: ships only alongside the moderation pipeline from #2, never before. |

## Build sequence (risk-adjusted ROI)

1. **Share-your-vote card** — low risk, feeds the growth loop clones can't (they have no vote to share). Prefilled X / Bluesky / Facebook / Threads / copy-link.
2. **Usernames + moderation tooling** — `username` + report/block models, username picker, report UI, rate-limiting. Unlocks the discussion moat.
3. **Per-bill news feed** — news source attached to bill pages, source + lean labels, balanced pairing. Retention win between roll calls.
4. **Live chat (gated)** — per-bill, only behind the #2 moderation pipeline.

**Hard gate (council insists):** no user-generated-content feature ships without
reporting + blocking + escalation in place first. Moderation is a launch
requirement for a politics app, not a fast-follow.

## Open positioning questions (carried from analysis §4)

- Name the wedge in marketing copy? ("the civic platform with a community, not just a feed")
- Build a bill Q&A chatbot to match How Congress Votes, or treat as distraction from the moat?
- Sharpen "personal impact" framing where BillBoard currently leads?
