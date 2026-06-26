# Democracy Unlocked — Design System ("Broadsheet")

Trustworthy, nonpartisan, editorial. Source of truth: `app/globals.css` (CSS
custom properties) + `tailwind.config.js` (utility mapping). Extend these — do
not hardcode hex in components (data-viz palettes excepted).

## Typography
- **`--font-sans` (Inter)** — all UI, body, and the existing `font-display`
  headings (card titles, section headers). Keep UI chrome sans.
- **`--font-serif` (Source Serif 4)** — *opt-in* editorial display only: hero
  headlines, marketing, large page titles. Use the `font-serif` utility. Do not
  apply to dense UI.
- Weights: **400 and 600 only.**

## Color
| Token | Value | Use |
|---|---|---|
| `--accent` (navy) | `#0A2463` | Primary. Buttons, links, brand. |
| `--accent-red` | `#B91C1C` | Sparingly — urgent CTA, "no" vote, alert. |
| `--gold` | `#C79A3E` | Signature accent. Display accent words, premium highlight, primary CTA on dark. Use sparingly (one accent per view). `--gold-text #9A751F` for gold text on light. |
| Semantic | `--success/warning/danger/info` | Status only. |
| **Party** (affiliation) | `--democrat #2563EB` · `--republican #DC2626` · `--independent #7C3AED` | A member's party — factual. |
| **Lean** (editorial) | `--lean-left #4F6D9E` · `--lean-center #8A8F98` · `--lean-right #B06A4A` | News/source lean. Deliberately muted and **distinct from party colors** so it never reads partisan. Never use party blue/red for lean. |

Tailwind utilities: `font-sans/display/serif`, `text-navy bg-navy`, `text-gold bg-gold text-gold-text`, `text-lean-left/center/right` (+ `*-light` CSS vars for tint backgrounds).

## Scales (already locked, unchanged)
- Radius: `--radius` 8px base (`-xs`3 `-sm`5 `-md`10 `-lg`14 `-xl`18 `-2xl`24 `-full`).
- Spacing: `--space-1..` 4px step.
- Shadow: `--shadow-xs..xl`.

## Components (patterns)
- **Button** — primary: `bg-[--accent] text-white`, radius `--radius`, hover `--accent-hover`. Secondary: `border border-[--border-strong] text-[--accent]`. On dark surfaces, primary = `bg-[--gold] text-[#1a1303]`. One primary per view.
- **Card** — `bg-[--surface]` 0.5px `--border`, radius 12px, `--shadow-sm`.
- **Badge/pill** — tinted bg `*-light` + same-family dark text (e.g. lean-right tint + `--lean-right` text). Never black text on a colored tint.
- **Stat strip** — number `font-display` 24px/600 in `--accent`, label 13px `--text-muted`. Numbers must be **real/live** (Congress.gov-backed), never fabricated.
- **Nav** — sticky, `--surface`, `max-w-6xl mx-auto px-5`, 56px tall.

## Principles
1. Real data over claims — no fabricated metrics or "as featured in" logos.
2. Serif is the voice (editorial), sans is the chrome (UI).
3. Lean ≠ party — keep the two color systems separate.
4. One accent (gold) per view.
