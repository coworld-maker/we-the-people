# Passdown — The money numbers on the bill page meant something other than what they said

**Project:** Democracy Unlocked™ (democracyunlocked.com)
**Date:** September 2, 2026
**Repo:** `~/Documents/GitHub/we-the-people` (public, AGPL). Deploys to Vercel on push to `main`.
**Prior passdown:** [2026-08-24-data-correctness-sweep.md](./2026-08-24-data-correctness-sweep.md) · **Start-here:** [RESUME.md](./RESUME.md)

> ✅ **SHIPPED AND VERIFIED IN PRODUCTION.** `main` @ `19bd223`. Confirmed on the live
> H.R. 3633 page, not a harness — §5.1 is closed. Three display fixes plus build
> hygiene (lockfile + `engines`). Two new defects found in the closing sweep are
> **open** — see §6.6 and §6.7; the first is more serious than anything fixed here.

---

## 0. TL;DR

The bill page carried **three** financial figures. Every one was accurately transcribed from its source. Every one was placed so that it asserted something untrue.

1. **LDA lobbying dollars read as per-bill spend.** A bold `$1.2M` under "Who's lobbying this bill?" is actually the filer's total for the reporting period across every issue in the filing.
2. **FEC donor figures read as corporate donations.** "LOCKHEED MARTIN — $47,000" reads as the company donating. Companies *cannot* donate to federal candidates at all; the figure sums contributions from individuals who named that employer. The row asserted something legally impossible.
3. **Ten filings listed under a "32 lobbying firms" badge.** Both numbers correct; together they read as a contradiction.

Same species as the 2026-08-24 sweep, one level up: **code running clean while displaying a true number that means something other than what the layout says it means.** No error, no crash, no bad data. A data-correctness audit that checks values against the source passes all three.

**Fixed by labeling, not deleting** — the qualifier each number needed was already in the API and unused (`filing_period`, `FECDonor.count`, and the pre-slice total that `getLobbyingForBill` was discarding).

Two bugs were found *while* fixing these, both of the "a missing value silently becomes a plausible one" kind: the FEC cycle label (§3.5) and, still open, the AI confidence fallback (§6.7).

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

### 3.4 Section A — the FEC donor figures (the legally impossible one)

Section A carried the **exact construct** removed from Section B: `text-[11px] font-semibold text-amber-600 shrink-0`, bare, adjacent to a name. It rendered `LOCKHEED MARTIN  $47,000` and read as Lockheed Martin donating $47,000.

That is not merely misleading. **Corporations and unions may not contribute to federal candidates from their treasuries at all.** The value comes from FEC `/schedules/schedule_a/by_employer/` — itemized receipts grouped by the employer string each *individual* contributor self-reported. The employer is a **grouping key, not a donor**. Compounding it, the panel renders on a bill page, so readers bind cycle-wide campaign money to the bill on screen.

Fixed:
- amount de-emphasized to `--text-secondary`, matching Section B
- heading → **"Who funds the sponsors' campaigns?"** (the old phrasing invited bill-attribution)
- the shared qualifier moved into the **column header at readable weight**: `WHERE THEIR INDIVIDUAL DONORS WORK · 2026 CYCLE` / *"Money from people who work there, not from the company. Not tied to this bill."*
- the previously unused `FECDonor.count` surfaced inline: `COINBASE  14 donations  $45K`

**Why the header, not a per-row caption** (this differs from Section B deliberately): all five rows share one qualifier, whereas each LDA filing has its *own* period. A stacked per-row caption was built, rendered, and **rejected on the evidence** — it made every row three lines, repeated "contributions" five times down the column, and floated each caption toward the *next* employer. See learning #6; reasoning about the markup would not have caught it.

### 3.5 `lib/api/fec.ts` — the cycle label could be two years stale

Found while wiring the caption above, and it *mattered* because the fix puts the cycle in front of the reader.

`getTopDonorsByEmployer` falls back to the previous cycle when the current one is empty, but returned only the donor array. So `getTopDonorsForCandidate` reported `currentFECCycle()` regardless — **captioning two-year-old contributions as this cycle's.** It now returns the cycle the rows actually came from.

Same family as the LDA null-semantics bug: a fallback path producing a value indistinguishable from the real thing.

Also documented at the interface: what `total` sums, that `employer` is a grouping key, and that only the first principal committee is queried.

### 3.6 The 10-of-32 truncation (was §6.3)

`getLobbyingForBill` already fetched the full matched set and **threw the count away** in `filings.slice(0, 10)` — the information needed to label the cap was computed and discarded on every request. It now returns `{ filings, total }`, exports `LOBBYING_ROW_LIMIT`, and documents that any caller rendering fewer rows than `total` must say so.

The subheader now reads `Senate LDA lobbying disclosures · showing 10 of 32`, and the verify link becomes `See all 32 filings on the Senate LDA database`.

**In the subheader, not the footer** — it defines what the list *is*, so it must be read before the rows (learning #4).

The count is deliberately the **live** total from the fetch that produced the rows, not the stored `bill.lobbyingFirmCount` TrustBar uses: a stale stored value would caption rows with a number they don't belong to. The two can still differ until `sync-lobbying` runs, but each is now internally consistent with what it labels.

### 3.7 Build reproducibility — lockfile and `engines`

Not a display fix; it is why §5.2 is now fully resolved.

- **`package-lock.json` committed.** The repo had none, so every install resolved the tree afresh. lockfileVersion 3, 429 packages, npm is unambiguous (no yarn/pnpm/bun lockfile).
- **`engines` pinned to `node: 24.x`, `npm: >=10`.** Not a guess: the Vercel project (`prj_oTd0FIkNWtMrZhl2Gmox5ySGjq4h`) is configured `nodeVersion: "24.x"`, and the lockfile was generated on Node 24.20.0. It also satisfies every dependency, the binding one being **Prisma 7** (`^20.19 || ^22.12 || >=24.0`).

⚠️ **This changed install behaviour:** with a lockfile present, Vercel switches from `npm install` to **`npm ci`**, which *fails the build* when the lockfile and `package.json` disagree rather than silently reconciling. Verified with `npm ci --dry-run` before committing, and confirmed by a clean production build. If a future dependency edit breaks the build, this is the first thing to check — run `npm install` and commit the lockfile alongside the `package.json` change.

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

FEC side, swept the same way:

| Consumer | Surfaces | Verdict |
|---|---|---|
| `components/bills/LobbyingPanel.tsx` Section A | `FECDonor.total` | 🔴 was the bug — fixed |
| everything else | — | ✅ `getTopDonorsForCandidate` has exactly one caller |

Other `d.total*` hits in the codebase are `totalVotes` / `totalComments` in gamification and dashboard code — unrelated. `getLobbyingForBill` has **two** callers: this panel and `app/page.tsx` (`getMoneyStrip`), which uses only client *names* and takes its count from the stored `lobbyingFirmCount`, so the row cap is harmless there.

---

## 5. Verification

- `tsc --noEmit` — clean.
- `npm test` (vitest) — 23 passed / 3 files.
- **Live LDA data** through the real `getLobbyingForBill('HR','3633',119)` code path: `firmCount: 32`, 10 filings returned, `period` populated as `"Q2 2025"` on every row.
- Rendered the panel's exact markup and Tailwind classes at desktop and 375px mobile. All 10 rows clean, no overflow, footer legible. `CONNECT STRATEGY` (no income/expenses) correctly renders **no money column at all** and its description takes the full width.

### 5.1 ✅ CLOSED — verified on the live site

**There are still no `.env` files**, so the app cannot boot locally and every pre-merge check used a harness that reused the real data path and real markup. That gap is now closed the only way it could be: by shipping and checking production.

Confirmed on `https://www.democracyunlocked.com/bills/bill_1776044912968_gfndbm5` after deploy:

| Assertion | Live |
|---|---|
| `Who funds the sponsors' campaigns?` | ✅ |
| `WHERE THEIR INDIVIDUAL DONORS WORK · 2026 CYCLE` | ✅ |
| `Money from people who work there, not from the company. Not tied to this bill.` | ✅ |
| Inline counts (`COINBASE 14 donations $45K`) | ✅ one line per row |
| `Senate LDA lobbying disclosures · showing 10 of 32` | ✅ |
| `See all 32 filings` | ✅ |
| `Q2 2025 total / all issues` | ✅ |
| `No public data breaks lobbying spending out by bill` | ✅ |

**The standing lesson survives the close:** a harness proves data flow and layout, never that the page renders in situ. Until this repo has a bootable local environment, "verified" means *verified in production*, and any future claim of verification should say which of the two it is.

### 5.2 ✅ RESOLVED — local toolchain, and the lockfile question is settled

`node_modules/` is installed: `./node_modules/.bin/tsc --noEmit` and `npm test` run locally, no push needed. Prior passdowns saying *"No local Node → the Vercel build is the typechecker"* are **stale**; RESUME.md is corrected. Env vars are still missing, so the *app* still cannot run — typechecking and unit tests are the local ceiling.

`package-lock.json` is now **committed**, with `engines` pinned alongside it — see §3.7, including the `npm ci` behaviour change.

---

## 6. Next steps

### 6.1 ✅ DONE — committed, merged, deployed
`main` @ `19bd223`. The lockfile branch was merged **first and alone** so a build break could be attributed; it built clean, then the display fixes merged.

### 6.2 ✅ DONE — RESUME.md corrected
Pointer updated to this passdown; the stale "no local Node" line fixed.

### 6.3 ✅ DONE — see §3.6

### 6.4 🟡 `income || expenses` conflates two different things
`income` = what an outside firm was **paid by** its client. `expenses` = what an organization spent on its **own in-house** lobbying. The panel coalesces them into one number. The new caption stays accurate either way (both are per-period lobbying money), so this is not a correctness bug — but the row asserts an equivalence that doesn't hold, and distinguishing them would tell readers whether they're looking at a hired gun or a self-advocating org.

### 6.5 🟡 No test covers `periodLabel`
The suite has no LDA tests. `periodLabel` is pure and trivially testable — worth pinning the `mid_year`/`year_end` and unknown-code fallbacks so nobody "simplifies" the fallback into a guess later.

### 6.6 🔴 OPEN — "Your Impact" shows three numbers that measure nothing

The sweep §6.6 called for was run. Section A was the first stop and is fixed (§3.4). The dashboard is worse.

`app/(dashboard)/dashboard/page.tsx:123`:

```ts
alignmentPct: profile.stats.totalVotes > 0
  ? Math.min(Math.round((profile.stats.totalVotes / (profile.stats.totalVotes + 5)) * 100), 95)
  : 0,
```

Rendered by `components/dashboard/YourImpact.tsx` as a 160px animated donut captioned **"Voting Alignment"**, colour-coded green ≥70 / amber ≥40 / red — so it reads as a performance score.

**It is a function of the user's own vote count and nothing else.** There is no second party in the formula: no representative, no comparison of positions. Vote 5 times → 50%; 45 times → 90%; it asymptotes at 95.

Two more in the same card: **"Bills you've influenced:"** is `totalVotes` (casting an opinion vote here does not influence a bill), and **"Representative contacts:"** is a hardcoded `0` styled identically to a measurement.

**This is a category worse than anything fixed above.** Those were true numbers under misleading labels; this is a number with **no referent**. And the sharpest part: **a real alignment calculation already exists** — `lib/services/alignmentService.ts`, and `components/dashboard/YourRepresentatives.tsx` renders it honestly *two cards away* as `{matchedVotes}/{totalOverlap} votes match`. `StateAlignmentCard` even handles the null case correctly. The dashboard ignores all of it.

When fixing: a user with no votes has **undefined** alignment, not 0% — do not repeat the LDA "failed lookup stored as 0" bug.

### 6.7 🟠 OPEN — "78% confidence" is the model rating itself, and a missing value becomes 70

`components/bills/ImpactPanel.tsx:45` renders `{imp.confidence}% confidence` bare. The value is produced by the LLM: `lib/services/aiService.ts` asks for it in the prompt schema (`"confidence":75`). It is an uncalibrated self-rating presented as an evidentiary measure.

Worse, `aiService.ts:235`: `confidence: impact.confidence || 70`. A missing value silently becomes `70` and renders identically to a real one — **the same defect as the LDA `?? 0`** this repo already fixed. `BillImpact.confidence` is `Float?` in the schema, so null can be stored and rendered honestly.

Not to be confused with `Vote.confidence`, a genuine user-supplied 1–5 self-report.

### 6.8 ✅ Sweep finished — and most of the site already passes

§6.6 and §6.7 are **fixed and live** (`ebdd321`). The remaining surfaces were swept with the same question. Result worth recording: **the two dashboard bugs were outliers, not the norm.**

**Passed — and these are the reference patterns to copy:**

| Surface | Why it passes |
|---|---|
| `StateSentimentMap` | Tooltip gives `yes–no–abstain (N votes)`; explicit warning under 5 votes; low-confidence states drawn at reduced opacity; a real empty state at `totalVotes === 0` rather than an all-grey map implying consensus. |
| `StateAlignmentCard` | Renders **"Not enough data yet"** on null instead of 0%, and always shows the denominator: *"Voted with GA majority on 12 of 18 bills"*. This is the pattern §6.6 should have followed from the start. |
| Transparency page | "Platform-wide vote breakdown" is scoped correctly (users, not Congress) and prints the raw count beside every percentage. |

**Open — the one real finding (chip filed):**

The **"Affects GA"** badge (`app/(dashboard)/bills/page.tsx:57,68`, duplicated in `PersonalizedBills.tsx:290,299`) is a flat declarative claim, but the score behind it is an *estimate*:

- the fast path is `getStateImpactsForPolicyArea(bill.policyArea)` — a lookup keyed **only on policy area**, so every bill sharing an area gets identical state scores. The badge implies bill-specific analysis; that path never read the bill.
- the slow path is an LLM prompt that says *"Estimate how much each U.S. state would be affected"*.

And the gate contradicts the code's own docstring: it fires at `>= 0.6`, while `analyzeStateImpact` defines **0.4–0.7 as moderate** and 0.7+ as high. Bills the system itself calls moderately affected render an unqualified assertion.

Cheapest fix follows learning #8: the `reason` string is already generated and stored for every state, and never displayed.

**Minor, unfixed:** the transparency page labels `totalUsers` as **"Registered citizens"**. The platform cannot verify citizenship; they are registered users. Low severity, but it is the same species — a label claiming more than the data supports.

---

## 7. Learnings

1. **A true number can still be a false claim.** Every figure here was accurately transcribed from LDA. The falsehood was manufactured by placing it under a heading that scoped it to one bill. Data-correctness audits that verify values against the source will pass this bug every time.
2. **Proximity asserts attribution.** Put a number next to a subject and readers bind them, whatever the fine print says. Layout is a factual claim.
3. **Prefer labeling to deleting.** Removing the figure would have been safe and lossy. The fix that preserves the most verifiable information is usually to say precisely what the number is — and the API often already carries the qualifier you need (`filing_period` was sitting right there, unused).
4. **Fine print doesn't fix a headline.** The footer already warned that one filing covers many bills. It didn't help, because the bold `$1.2M` was read first and read alone. The correction has to live at the same visual weight as the claim.
5. **Don't build a heuristic to hide a labeling problem.** Option 3 (suppress unless exactly one bill) would have parsed a *truncated* snippet and produced confident wrong answers — replacing a visible bug with an invisible one.
6. **Check what the layout does at the real string lengths.** The caption's wrap orphaned a word and broke the phrase; the fix was a deliberate `<br />`. Rendering with live data caught it — reasoning about the markup would not have. Section A proved it twice: a per-row caption that read fine in the abstract became three-line rows with "contributions" repeated five times down the column, visible only once rendered.
7. **A shared qualifier belongs in the header; a per-row one belongs in the row.** Section B's period differs per filing, so it captions each row. Section A's qualifier is identical for all five, so repeating it was noise that made the card *harder* to read. Same defect, opposite fix — copying the earlier solution verbatim would have been wrong.
8. **The qualifier you need is usually already in the data.** `filing_period`, `FECDonor.count`, and the pre-slice total in `getLobbyingForBill` were all present and unused; the truncation count was literally computed and discarded on every request. Before adding a fetch or inventing a caption, check what the payload already carries.
9. **Fixing a label can expose a lie underneath it.** Putting the FEC cycle in front of the reader surfaced that the cycle could be two years stale, because the fallback path never reported which cycle it used. Promoting a value to prominence is a good moment to re-derive whether it is true.
10. **A number with no referent is worse than a mislabeled one.** Every bug fixed here displayed a real value from a real source. The dashboard's "Voting Alignment" (§6.6) is a curve over the user's own vote count — no second party, nothing measured. A reader cannot catch that by checking the source, because there is no source.
11. **Verification has two tiers, and they must be named.** A harness proves data flow and layout; only production proves the page renders. This session claimed "verified" for harness checks and had to keep flagging §5.1 until deploy. Say which tier you mean, every time.
