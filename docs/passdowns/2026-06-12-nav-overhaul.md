# We The People — Navigation & UI Overhaul Passdown

**Project:** We The People (democracyunlocked.com)
**Date:** June 12, 2026
**Status:** IA direction approved — implementation in progress
**Owner:** Product/founder
**Decision of record:** Adopt task-based navigation — **Track / Know / Act** (Option 1)

---

## 1. Problem statement

User feedback is consistent and overwhelming: people value the information on the platform but report they "don't know how to maneuver through the app." Content quality is winning; information architecture is losing. Left unaddressed, this caps retention and undermines the share-link growth loop — visitors arrive at a bill page, read it, and leave because there is no obvious next step.

The diagnosis breaks into three failure modes. **Findability** — users can't locate features they know exist. **Discoverability** — users don't know what exists at all (the Engage dropdown hides its contents behind hover, which is invisible on touch devices). **Orientation** — users land deep in the app from share links and can't tell where they are or where to go next (bill and rep detail pages are dead ends).

## 2. Root causes identified

The current top nav (Dashboard · Bills · Representatives · Discussions · Engage) is organized around the database, not the user. Citizens think in tasks — "what's happening that affects me," "how did my rep vote," "what can I do about it" — not in entity names. Specific issues:

1. Noun-based labels describe features, not user goals. "Engage" in particular is too vague to predict.
2. The highest-value pages (bill detail, rep detail) terminate with no onward links.
3. The Engage dropdown requires hover — broken on mobile, which is likely the majority of share-link traffic.
4. The mobile hamburger hides the entire nav, cutting discoverability roughly in half versus visible navigation.
5. Active states in the nav are too subtle against the navy theme, so users lose track of where they are.
6. No global search — when navigation fails, there is no escape hatch.

## 3. Approved direction

### New information architecture (Option 1 — approved)

A persistent global search (Cmd+K plus a visible header search field) sits above everything and reaches bills, reps, and topics from any page. Below it, four task-based sections:

| Section | Replaces | Contains |
|---|---|---|
| **Home** | Dashboard | Personalized feed, stats widgets, activity timeline |
| **Track** | Bills | Bill feed, tracked bills, filters, bill detail pages |
| **Know** | Representatives | Your reps, rep profiles, voting records, districts |
| **Act** | Discussions + Engage | Contact-your-rep, discussions, share, feedback |

Key structural rules: the Engage hover dropdown is **retired** — its contents become a real "Act" hub page with visible cards, nothing hidden behind hover. Home remains the default landing for signed-in users. On mobile, the same four sections render as a **bottom tab bar** (always visible, thumb-reachable) instead of a hamburger.

### Cross-link layer

Bill detail, rep profile, and discussion pages link to each other bidirectionally so content navigates itself: bill pages show "how your rep voted," "join the discussion (N comments)," and "related bills on this topic"; rep pages link to their recent votes and the underlying bills; discussions link back to their bill. This is the primary fix for the dead-end problem and matters most for share-link arrivals.

## 4. Build order (council consensus, ranked by impact-per-effort)

1. **Global search (Cmd+K + header field)** — universal escape hatch; biggest single fix. Suggested: `cmdk` library, index bills/reps/topics, fuzzy match on bill numbers and plain-language titles.
2. **Nav restructure + unmistakable active states** — relabel to Home/Track/Know/Act, retire the Engage dropdown into the Act hub, strong active indicator (not a subtle color shift on navy), orienting page titles (e.g. "Bill · HR 2847 · Healthcare").
3. **Mobile bottom tab bar** — 4 tabs max, replaces hamburger on small viewports.
4. **Cross-link modules** — "Related" components on bill/rep/discussion pages per Section 3.
5. **Teaching empty states + 60-second first action** — empty states that instruct ("You're not tracking any bills yet — here's how"), and a guided first action: get a new user tracking one bill within their first minute. Build last; items 1–4 may reduce or remove the need.

**Non-goals for this phase:** full visual redesign (Stripe-style navy theme stays), onboarding tour/walkthrough modals (deferred pending results of 1–4), restructuring URLs/routes beyond what the nav requires, and new content features.

## 5. Instrumentation (do before or alongside item 1)

Add basic analytics so the changes can be judged: nav-item click-through, dead-end detection (pages with high exit and no internal clicks), back-button frequency after landing on detail pages, and search usage once shipped. Targets to evaluate at 30 days post-launch: search used in a meaningful share of sessions, measurable drop in single-page exits from bill detail, and a decline in "can't navigate" feedback volume.

## 6. Accessibility requirements (apply to every item)

Visible focus states on all nav and search elements; proper landmark regions (`nav`, `main`, `search`); no functionality gated behind hover; route transitions respect `prefers-reduced-motion`; bottom tab bar items carry accessible labels, not icon-only.

## 7. Technical context

Next.js App Router codebase deployed on Vercel. Existing relevant work: fade/slide route transitions, scroll reveals, and breadcrumbs were previously added — verify breadcrumbs exist on **every** deep page, especially bill detail reached via external links. Dashboard widgets (TrackedBills, YourRepresentatives, VotingPatterns, YourImpact) carry over into Home. No new database tables expected for items 1–4; cross-links compute from existing votes/discussions data.

**Implementation note (Jun 2026):** `cmdk` could not be added (no package installs available in the build environment); the command palette is a custom component at `components/ui/CommandPalette.tsx` backed by `app/api/search/route.ts`.

## 8. Open questions

- **Label test (product):** "Track / Know / Act" is approved, but validate with a quick 5-second test or the existing community poll channel before full rollout — clever labels lose to literal ones in testing more often than not. Fallback labels: Bills / My Reps / Take Action.
- **Mobile traffic share (data):** confirm actual mobile percentage to prioritize the bottom tab bar correctly.
- **Search scope v1 (engineering):** bills + reps + topics only, or include discussions? Recommend bills + reps first. → **v1 shipped as bills + reps + topics.**
- **Where does Share Feedback live (product):** inside the Act hub, or footer-only? → **v1: inside the Act hub (env-gated as before).**

## 9. Decision log

| Date | Decision | Rationale |
|---|---|---|
| Feb 2026 | Stripe-style navy redesign, emoji removal | Audience: politically engaged adults 25–55; credibility over playfulness |
| Feb 2026 | Fade/slide transitions, scroll reveals, breadcrumbs | First pass at wayfinding |
| Jun 12, 2026 | **Adopt Track/Know/Act task-based IA** (Option 1) | Overwhelming feedback: content valued, navigation failing; council review |
| Jun 12, 2026 | Build order: search → nav → mobile tabs → cross-links → empty states | Impact-per-effort ranking |
| Jun 12, 2026 | Items 1–4 shipped and live-verified (search, Track/Know/Act + /act hub, bottom tab bar, RelatedBills) | This session; item 5 deferred per ranking |
| Jun 12, 2026 | Get Started promoted to top-level nav item (desktop); mobile tab bar stays at 4 tabs | Founder call: beta audience is mostly new users; guide needs zero-hunt visibility |

---

*This document should be updated as items ship — move them from Section 4 into the decision log with dates.*
