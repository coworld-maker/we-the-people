# Contributing to Democracy Unlocked

Thanks for being interested. This project exists because we think civic
infrastructure should be auditable and improvable by the community it serves.

Here's how to plug in.

---

## Ways to contribute

You don't have to write code to help.

- **🐛 File a bug.** Found something broken or confusing? [Open an issue](https://github.com/coworld-maker/we-the-people/issues/new?template=bug_report.md) with steps to reproduce.
- **✨ Suggest a feature.** Got an idea? [Open an issue](https://github.com/coworld-maker/we-the-people/issues/new?template=feature_request.md) describing the user problem.
- **📝 Improve the docs.** Typos, unclear instructions, missing context — please send PRs against [`docs/`](./docs).
- **🔬 Domain expertise.** The deterministic per-state impact weights in [`lib/data/state-impact-weights.ts`](./lib/data/state-impact-weights.ts) are heuristics drawn from public USDA / EIA / BLM / DHS / Census data. Subject-matter experts are extremely welcome to refine them with sources.
- **🌎 Translation.** Spanish UI is on the wishlist. If you'd like to lead that, open an issue and we'll scope it together.
- **💻 Code.** Read on.

---

## Local development setup

```bash
# Clone
git clone https://github.com/coworld-maker/we-the-people
cd we-the-people

# Install
npm install   # postinstall runs `prisma generate`

# Configure env vars — see README.md "Quick start"
# Minimum to run locally: a Supabase DB, a Clerk app, a Congress.gov key.
# AI features need ANTHROPIC_API_KEY but most of the app works without it.

# Run
npm run dev
```

For the local database, we recommend creating a free Supabase project and
applying the schema:

```bash
# Set DATABASE_URL to your dev Supabase project's connection string in .env.local
prisma migrate deploy
```

See [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) for everything else (syncs,
troubleshooting, ops).

---

## Picking something to work on

- Issues tagged **`good first issue`** are scoped to be approachable for a new contributor.
- Issues tagged **`help wanted`** are larger but well-defined.
- Anything else in the [issue tracker](https://github.com/coworld-maker/we-the-people/issues) is fair game — just comment first so we don't duplicate work.
- The [community feature poll](./docs/Community-Feature-Poll.docx) is a structured way to see what users have asked for.

If you want to propose something not in the tracker, **open an issue first**.
Don't write 600 lines of code as a surprise PR — we'd rather agree on the
direction before you invest time.

---

## Pull request workflow

1. **Fork** the repo (or branch directly if you have write access).
2. **Branch** from `main`: `git checkout -b your-feature-name`.
3. **Write** your change. Try to keep PRs focused — one logical change per PR.
4. **Test locally**: `npm run dev` + manual testing of the affected pages.
   `npm run build` should pass.
5. **Write a useful commit message.** Style: imperative mood, capitalize first
   word, explain the *why* in the body. Look at [recent commits](https://github.com/coworld-maker/we-the-people/commits/main) for examples.
6. **Open the PR.** Reference the related issue (`Fixes #123`).
7. **Update the DEVLOG.** Add a top-of-file entry to [`docs/DEVLOG.md`](./docs/DEVLOG.md)
   describing what you shipped. Format is documented at the top of that file.
8. **Wait for review.** We're a small team — give us a week. Bug us on the PR
   if we go quiet.

---

## Code style

- **TypeScript strict mode** — please don't add `any` without comment.
- **Functional React** — no class components.
- **Server components by default.** Use `'use client'` only when you need
  state, effects, or browser APIs.
- **Tailwind classes** for styling — no separate CSS files except `globals.css`.
- **CSS variables** for colors (`var(--accent)`, `text-[--text]`) so light/dark
  theme tweaks happen in one place.
- **No semicolons** in this codebase (matches Next.js conventions). The build
  doesn't enforce it but please match the surrounding style.
- **Comments explain why, not what.** The code shows what; you don't need to
  restate it. Comment when the choice is non-obvious or when there's a tradeoff
  the next reader should know about.

We don't run a formal linter / formatter (Prettier-style autofix) — but the
existing code is consistent. If you change tabs to spaces or alphabetize
imports in a PR, please do it in a separate commit so the substantive review
isn't drowned in noise.

---

## Database changes

Schema is in [`prisma/schema.prisma`](./prisma/schema.prisma).

For any new column or table:

1. Edit `schema.prisma`.
2. Run `prisma migrate dev --name short_description` locally — generates a SQL
   file in `prisma/migrations/`.
3. Commit both the schema change and the migration file.
4. The migration runs on next deploy via `prisma migrate deploy` (or sometimes
   applied manually via Supabase MCP — see [`docs/RUNBOOK.md`](./docs/RUNBOOK.md)).

If you're touching encrypted fields or PII, please CC a maintainer on the PR.

---

## Tests

We don't currently have a test suite. (Yes, we know.) Adding one is on the
roadmap — if you'd like to be the person to bootstrap it, that's a fantastic
contribution and we'd love to discuss approach in an issue first.

For now: please describe your manual-testing steps in the PR description so
reviewers can verify.

---

## Code of Conduct

By contributing, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
TL;DR: be kind, assume good faith, give people the benefit of the doubt.
This is a political-content platform — we're going to disagree, and that's
fine, as long as we do it respectfully.

---

## Communication

- **GitHub Issues** — bug reports, feature requests, design discussion
- **GitHub Discussions** (if enabled) — broader Q&A, ideas, show-and-tell
- **Email** — `hi@democracyunlocked.com` for anything that doesn't fit either
- **Security** — `security@democracyunlocked.com` (see [SECURITY.md](./SECURITY.md))

Welcome aboard. 🇺🇸
