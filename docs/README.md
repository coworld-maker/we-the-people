# Democracy Unlocked — Documentation

A small set of living documents for anyone working on the project.

| Doc | Read when | Maintained by |
|---|---|---|
| **[STATUS.md](./STATUS.md)** | First, every time — current snapshot, env vars, action items | Update after every significant deploy or env change |
| **[DEVLOG.md](./DEVLOG.md)** | When you need "why is it like this" context on a recent change | Update at the top after shipping anything meaningful |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | First week on the project — system overview, data flow, conventions | Update when the directory structure or data flow changes |
| **[RUNBOOK.md](./RUNBOOK.md)** | When you need to deploy, migrate, sync, or troubleshoot | Update when ops procedures change or new tools land |
| **[Community-Feature-Poll.docx](./Community-Feature-Poll.docx)** | When setting up the Microsoft Form for community feedback | Update when the question set changes |

## For a new contributor

1. Read **STATUS** (5 min) — get a snapshot of where things stand.
2. Skim **ARCHITECTURE** (15 min) — understand the system before touching it.
3. Skim the top 5–10 entries of **DEVLOG** (10 min) — see what's been done lately and the reasoning.
4. Keep **RUNBOOK** open when doing ops.

## For someone shipping work

1. **Before**: skim STATUS and the relevant section of DEVLOG.
2. **During**: refer to RUNBOOK for any ops step.
3. **After**: add an entry to the top of DEVLOG describing what shipped and why. Update STATUS if any of its lines are now stale.

## Format for DEVLOG entries

See the "How to add an entry" section at the top of [DEVLOG.md](./DEVLOG.md). Short version:

```markdown
## YYYY-MM-DD — your name

### Title of the work

**What shipped:** Brief paragraph. Link commits.
**Why:** The motivation.
**How to verify:** A specific check anyone can perform.
**Decisions / tradeoffs:** Anything non-obvious.
**What's next** (optional): Follow-ups.
```

That's it — keep it skimmable and decision-oriented, not exhaustive.
