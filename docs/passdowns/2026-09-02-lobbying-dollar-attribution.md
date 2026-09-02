# Passdown — The lobbying dollar figure implied per-bill spend

**Project:** Democracy Unlocked™ (democracyunlocked.com)
**Date:** September 2, 2026
**Repo:** `~/Documents/GitHub/we-the-people` (public, AGPL). Deploys to Vercel on push to `main`.
**Prior passdown:** [2026-08-24-data-correctness-sweep.md](./2026-08-24-data-correctness-sweep.md) · **Start-here:** [RESUME.md](./RESUME.md)

> ⚠️ **Work is UNCOMMITTED on `main`.** Two modified files, nothing pushed, nothing deployed. See §6.1.

---

## 0. TL;DR

The bill page's "Who's lobbying this bill?" panel showed a bold dollar figure next to each filer. That figure is the filer's **total** reported lobbying money for the quarter, across every issue and every bill in the filing — never spend attributable to the bill on screen. A reader saw `$1.2M` under a heading asking who lobbies *this* bill and drew the only available conclusion, which was false.

Same species as the 2026-08-24 sweep: **code running clean while displaying a true number that means something other than what the layout says it means.** No error, no crash, no bad data in the DB — the value is exactly what LDA reported. The defect was entirely in framing.

**Fixed by labeling, not deleting.** The number now carries the reporting period and an explicit "all issues" caption, and is visually de-emphasized so it stops reading as the bill's price tag.

---

## 1. The bug

`components/bills/LobbyingPanel.tsx` rendered, per filing:

```tsx
<span className="text-[11px] font-semibold text-purple-600 shrink-0">
  {fmt(filing.income || filing.expenses || 0)}
</span>
```

Bold, colored, right-aligned, no label — the most prominent element in the row, under the heading **"Who's lobbying this bill?"**

Confirmed against live LDA data for **H.R. 3633** (Digital Asset Market Clarity Act, `/bills/bill_1776044912968_gfndbm5`, Congress 119). Real rows as rendered:

| Filer | Shown | What the filing text actually covers |
|---|---|---|
| CREDIT UNION NATIONAL ASSOCIATION | **$1.2M** | Digital Asset Market Clarity Act **+ CFPB funding + children's investment accounts + auto loans** |
| KPMG LLP | **$430K** | S.1582, H.R. 2392, H.R. 3633, **plus Artificial Intelligence issues** |
| ANCHOR LABS, INC. | **$110K** | BITCOIN Act of 2025 **+** H.R. 3633 |
| MULTICOIN CAPITAL | **$50K** | market structure (H.R. 3633) **+** S.1582 GENIUS Act |
| CONNECT STRATEGY LLC (o/b/o CRYPTEX FINANCE) | *(none)* | S.1582 **+** H.R. 3633 — filing reports neither income nor expenses |

CUNA's real figure is `1170000`. Not one of these dollar amounts is bill-attributable, and **no public data source breaks LDA spending out by bill** — the disclosure regime simply does not collect it.

The footer disclaimer at the time read *"One filing covers many bills — read as disclosed interest, not confirmed lobbying on this bill alone."* That addresses **attribution of interest** but says nothing about the **money**, which was the part being misread.

---

## 2. Decision — relabel in the row (option 2)

Three options were on the table. Rejected two:

- **Remove the figure entirely.** Simplest and safest, but it discards true, sourced, independently verifiable data. The number was never the problem; the missing label was.
- **Show it only when a filing names exactly one bill.** Requires counting bill mentions in `LDAFiling.description` — which is **a ~220-char snippet windowed around the match** (`lda.ts`, the `start`/`end` slice), not the full activity text. The heuristic would misjudge truncated text and trade a known-bad number for a silently unreliable rule. Strictly worse: at least the old bug was legible.

**Chosen:** keep the figure, name the reporting period, caption it "all issues", and drop its visual weight so it no longer reads as a headline.

---

## 3. What shipped

### 3.1 `lib/api/lda.ts` — expose the reporting period

The LDA API already returns what's needed to label the figure honestly. Verified live against the endpoint:

```
filing_period         = 'second_quarter'
filing_period_display = '2nd Quarter (Apr 1 - June 30)'
filing_type           = 'Q2'
filing_year           = 2025
income                = '20000.00'
expenses              = None
```

Added `period?: string` to `LDAFiling` (`"Q2 2025"`), mapped from `filing_period` via `PERIOD_LABEL` (covers `first_quarter`…`fourth_quarter`, `mid_year`, `year_end`). **Unknown period codes fall back to the bare year rather than guessing** — the same "don't manufacture a value you can't back" rule from §5 of the last passdown.

Also documented the trap at the interface itself, so the next consumer can't repeat it:

```ts
// income/expenses are the filer's TOTAL for `period` across every issue and
// bill in the filing — NOT money attributable to the bill being viewed. Any
// UI showing these must label them as such (see components/bills/LobbyingPanel).
```

### 3.2 `components/bills/LobbyingPanel.tsx` — caption and de-emphasize

Bold purple → normal-weight `--text-secondary`, with a two-line muted caption:

```
$1.2M
Q2 2025 total
all issues
```

The line break is **explicit** (`<br />`). Left to wrap inside `max-w-[88px]`, "issues" orphaned onto its own line and the caption stopped reading as a single phrase — verified visually, not assumed.

### 3.3 Footer disclaimer — extended to cover the money

Appended to the existing text:

> Dollar amounts are each filer's total reported lobbying money for that reporting period across every issue in the filing. **No public data breaks lobbying spending out by bill, so none of these figures is the amount spent on this bill.**

---

## 4. Audit — where else does this number surface?

**Nowhere.** Full sweep of `income`, `expenses`, `lobbyingFirmCount`, and every `lib/api/lda` importer:

| Consumer | Surfaces | Verdict |
|---|---|---|
| `components/bills/LobbyingPanel.tsx` | dollars | 🔴 was the bug — fixed |
| `app/page.tsx` (`getMoneyStrip`) | client **names** + count only | ✅ no dollars |
| `components/bills/TrustBar.tsx` | `lobbyingFirmCount` | ✅ count is bill-matched |
| `app/(dashboard)/bills/page.tsx` | `lobbyingFirmCount` | ✅ same |
| `lib/services/billService.ts` | `most_lobbied` sort / filter | ✅ same |
| `app/api/sync-lobbying/route.ts` | writes `lobbyingFirmCount` | ✅ same |

The **count** is sound — it comes from the exact-match regex added on 2026-08-24, so it genuinely reflects filings naming this bill. Only the **dollars** were unattributable. This is worth holding onto: count = bill-specific, money = not.

---

## 5. Verification

- `tsc --noEmit` — clean.
- `npm test` (vitest) — 23 passed / 3 files.
- **Live LDA data** through the real `getLobbyingForBill('HR','3633',119)` code path: `firmCount: 32`, 10 filings returned, `period` populated as `"Q2 2025"` on every row.
- Rendered the panel's exact markup and Tailwind classes at desktop and 375px mobile. All 10 rows clean, no overflow, footer legible. `CONNECT STRATEGY` (no income/expenses) correctly renders **no money column at all** and its description takes the full width.

### 5.1 ⚠️ The app could not be booted locally — read this before trusting a "verified" claim

**There are no `.env` files in the repo.** No `DATABASE_URL`, no Clerk keys → the real bill page cannot render locally (server component hits Prisma + `auth()`). Verification above used a standalone harness that reused the real data path and the real markup, **not** the running app. It confirms data flow and layout; it does **not** confirm the page renders in situ.

**Confirm on the Vercel preview or production before calling this done.**

### 5.2 📌 "No local Node" is now out of date

RESUME.md and prior passdowns say *"No local Node → the Vercel build is the typechecker."* That was true because `node_modules/` was empty. **I ran `npm install`** — `tsc` and `vitest` now work locally and were used above. Env vars are still missing, so the *app* still can't run, but **typechecking and unit tests no longer require a push.** RESUME.md should be corrected (§6.2).

> Note: `package-lock.json` is untracked in git and **was already untracked before this session** — not created here. Worth deciding whether it should be committed, since a public repo without a lockfile gives contributors non-reproducible installs.

---

## 6. Next steps

### 6.1 🔴 Do first — commit and deploy
Nothing is pushed. Two modified files: `lib/api/lda.ts`, `components/bills/LobbyingPanel.tsx`. `main` deploys to Vercel on push. Branch first per repo convention, then verify the live H.R. 3633 page — that's the only step that closes §5.1.

### 6.2 🟠 Correct RESUME.md
It still says no local Node and still lists the lobbying badge under "known silent-empty risks." Update the start-here pointer to this passdown and fix the toolchain line.

### 6.3 🟠 The panel shows 10 of 32, unlabeled
`getLobbyingForBill` ends in `.slice(0, 10)`; `getLobbyingFirmCount` is unsliced. So TrustBar says **"32 lobbying firms"** and the panel below lists **10**, with nothing saying the list is truncated. A reader either thinks the count is inflated or thinks they're seeing everything. Same credibility family as the bug this session fixed — deliberately left out of scope to keep the change tight. *(A background task chip was filed for this.)*

Suggested fix: a footer line "Showing 10 of 32 filings" linking to the existing `ldaVerifyUrl()`. Handle `lobbyingFirmCount === null` and the case where the live filings count legitimately disagrees with the stored one.

### 6.4 🟡 `income || expenses` conflates two different things
`income` = what an outside firm was **paid by** its client. `expenses` = what an organization spent on its **own in-house** lobbying. The panel coalesces them into one number. The new caption stays accurate either way (both are per-period lobbying money), so this is not a correctness bug — but the row asserts an equivalence that doesn't hold, and distinguishing them would tell readers whether they're looking at a hired gun or a self-advocating org.

### 6.5 🟡 No test covers `periodLabel`
The suite has no LDA tests. `periodLabel` is pure and trivially testable — worth pinning the `mid_year`/`year_end` and unknown-code fallbacks so nobody "simplifies" the fallback into a guess later.

### 6.6 🟢 Sweep the same question across the rest of the site
This bug was a **label** problem, not a data problem, so the last sweep's "wrong data, no errors" hunt could never have caught it. The generalized question — *does every number on screen mean what its surrounding text implies?* — has not been asked of FEC donor figures, scorecards, or vote stats. Section A of this same panel is the obvious first stop: "Top donor employers" shows **itemized individual contributions by employer**, which is not the same thing as the employer donating, and the footer's *"Employers self-reported"* may not carry that distinction hard enough.

---

## 7. Learnings

1. **A true number can still be a false claim.** Every figure here was accurately transcribed from LDA. The falsehood was manufactured by placing it under a heading that scoped it to one bill. Data-correctness audits that verify values against the source will pass this bug every time.
2. **Proximity asserts attribution.** Put a number next to a subject and readers bind them, whatever the fine print says. Layout is a factual claim.
3. **Prefer labeling to deleting.** Removing the figure would have been safe and lossy. The fix that preserves the most verifiable information is usually to say precisely what the number is — and the API often already carries the qualifier you need (`filing_period` was sitting right there, unused).
4. **Fine print doesn't fix a headline.** The footer already warned that one filing covers many bills. It didn't help, because the bold `$1.2M` was read first and read alone. The correction has to live at the same visual weight as the claim.
5. **Don't build a heuristic to hide a labeling problem.** Option 3 (suppress unless exactly one bill) would have parsed a *truncated* snippet and produced confident wrong answers — replacing a visible bug with an invisible one.
6. **Check what the layout does at the real string lengths.** The caption's wrap orphaned a word and broke the phrase; the fix was a deliberate `<br />`. Rendering with live data caught it — reasoning about the markup would not have.
