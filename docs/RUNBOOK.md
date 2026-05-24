# Ops Runbook

Cheatsheet for day-to-day operations: deploys, migrations, syncs, troubleshooting.

> Pair with [`STATUS.md`](./STATUS.md) for env-var inventory and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system overview.

---

## Local development setup

```bash
# Clone + install
git clone https://github.com/coworld-maker/we-the-people
cd we-the-people
npm install        # Postinstall runs `prisma generate`

# Env vars — copy from a teammate or Vercel
cp .env.local.example .env.local   # if that file exists
# Otherwise create .env.local with at minimum:
#   DATABASE_URL=...
#   CLERK_PUBLISHABLE_KEY=...
#   CLERK_SECRET_KEY=...
#   CONGRESS_API_KEY=...
#   CRON_SECRET=...
#   ANTHROPIC_API_KEY=...

# Run dev server
npm run dev        # http://localhost:3000
```

For the brand logo system, after dropping `logo.png` at `public/logo.png`:

```bash
python3 scripts/prepare-logo.py
```

This generates `logo-mark.png`, `app/icon.png`, `app/apple-icon.png`, and the two PWA icon sizes.

---

## Deploys

**Auto-deploy on every push to `main`** via Vercel's GitHub integration. No manual step.

- Push to `main` → Vercel builds → if green, ships to production at https://www.democracyunlocked.com
- Preview deploys for branches: every branch gets a unique preview URL in the Vercel dashboard

**To roll back**: in the Vercel dashboard → Deployments → pick a previous successful deploy → "Promote to Production".

---

## Database migrations

⚠️ **Read this section in full before running anything against prod.**

### Two-track history

Most migrations live in `prisma/migrations/` and are applied via `prisma migrate deploy`. **Two recent migrations** (`add_user_state`, `add_bill_state_impacts`) were applied directly to Supabase via the MCP — they're in the prod schema but **not in Prisma's `_prisma_migrations` tracking table**.

If you run `prisma migrate deploy` against prod without reconciling, Prisma will try to re-apply those two migrations and the `ALTER TABLE` will fail (column already exists).

### Reconciliation steps

```bash
# Point DATABASE_URL at prod first!
prisma migrate resolve --applied 20251117000000_add_user_state
prisma migrate resolve --applied 20251118000000_add_bill_state_impacts
prisma migrate deploy   # now safe
```

Alternatively, delete the two migration folders since the SQL is already applied.

### Creating new migrations (going forward)

```bash
# Edit prisma/schema.prisma
prisma migrate dev --name short_description
# Review the generated SQL in prisma/migrations/...
git add prisma/
git commit -m "Add X column"
git push
# On next deploy, `prisma migrate deploy` runs in postinstall? — VERIFY
# Currently: postinstall only runs `prisma generate`, NOT migrate deploy
# So you'll need to apply migrations manually:
#   - via Supabase MCP (paste the migration.sql), or
#   - run `prisma migrate deploy` from a machine with prod DATABASE_URL
```

---

## Data syncs (Congress.gov → DB)

These endpoints are auth-gated via the `CRON_SECRET` env var (must match `x-sync-secret` request header).

### Sync new bills

```bash
curl -X POST https://www.democracyunlocked.com/api/sync-bills \
  -H "x-sync-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"congress": 119, "limit": 250, "offset": 0}'
```

Repeat with `offset=250, 500, …` until the response stops returning new bills.

### Backfill missing policy areas (free, no AI)

```bash
curl -X POST https://www.democracyunlocked.com/api/bills/refresh-policy-areas?limit=50 \
  -H "Cookie: <signed-in user session>"   # auth required, but it's a user-facing endpoint
```

Or trigger via the UI banner on `/policy-areas` (the "Refresh from Congress.gov" button).

### Sync congressional roll-call votes

```bash
curl -X POST https://www.democracyunlocked.com/api/sync-congress-votes \
  -H "x-sync-secret: $CRON_SECRET"
```

### Sync representative metadata

```bash
curl -X POST https://www.democracyunlocked.com/api/sync-representatives \
  -H "x-sync-secret: $CRON_SECRET"
```

### Set up Vercel Cron (recommended)

Add `vercel.json` to project root:

```json
{
  "crons": [
    { "path": "/api/sync-bills?congress=119&limit=250", "schedule": "0 6 * * *" },
    { "path": "/api/sync-congress-votes",                "schedule": "0 8 * * *" },
    { "path": "/api/sync-representatives",               "schedule": "0 10 * * 0" }
  ]
}
```

Then in the Vercel dashboard, add `x-sync-secret: $CRON_SECRET` as a header on each cron route under Settings → Environment Variables. (Or refactor the endpoints to accept `?secret=` via query param when the cron runs.)

---

## Monitoring & logs

### Application logs
- **Vercel Functions tab** — runtime logs from server components, API routes, edge functions
- **Vercel MCP** (if connected): `get_runtime_logs` lets you filter by level, status code, source
- Recent errors: `since: "30m"`, `level: ["error", "fatal"]`

### Build logs
- Vercel **Deployments** tab → click any deploy → "Build Logs"
- Useful for catching: type errors, missing migrations, env var issues

### Database
- Supabase **Database** → **Logs** — slow queries, errors, connection counts
- Supabase **Editor** for ad-hoc SQL

### AI usage
- Anthropic console: https://console.anthropic.com → Usage
- Watch for spikes: each bill analysis is ~$0.002 in Haiku tokens; if a day shows >$5, something's hot-looping

---

## Common tasks

### Reset a user's state preference

```sql
UPDATE "User" SET state = NULL WHERE clerkId = 'user_xxxxx';
```

### Force re-analysis of a bill (bypasses staleness check)

```sql
UPDATE "Bill" SET "aiAnalyzedAt" = NULL, "aiSummary" = NULL WHERE id = 'cuid_xxxxx';
DELETE FROM "ProCon" WHERE "billId" = 'cuid_xxxxx';
DELETE FROM "Impact" WHERE "billId" = 'cuid_xxxxx';
```

Then visit the bill page; auto-trigger fires fresh AI analysis on next view.

### Verify the pinned Claude model is still live

```bash
npm run check:model
```

Exits 0 = live, 1 = deprecation scheduled, 2 = retired, 3 = misconfigured. Run periodically; Anthropic gives ~6 months' notice on model retirements.

### Check what's in `Bill.stateImpacts` for a bill

```sql
SELECT id, "shortTitle", "policyArea", "stateImpacts"
FROM "Bill"
WHERE id = 'cuid_xxxxx';
```

If null: AI hasn't analyzed it yet (and there's no deterministic mapping for the policy area). Force generation by visiting the bill page or calling `POST /api/bills/[id]/state-impact`.

---

## Troubleshooting

### "Module not found" errors after `git pull`

```bash
rm -rf node_modules .next
npm install
npm run dev
```

### Prisma client out of date

```bash
prisma generate
```

This runs automatically on `npm install` via `postinstall`. Run manually if you change `schema.prisma` mid-session.

### Build fails with "Type X not assignable to Y"

Most commonly: schema drift between `prisma/schema.prisma` and the actual DB. Run `prisma db pull` against prod to see what Prisma thinks the schema is, compare to `schema.prisma`. Mismatch usually means a migration was applied to one side but not the other.

### Claude API returns 404 not_found_error

The pinned model in `lib/services/aiService.ts` (constant `CLAUDE_MODEL`) has been retired. Run `npm run check:model` and replace with the latest model from https://platform.claude.com/docs/en/about-claude/models/overview.

### Cookie banner re-appears every visit

User has cookies blocked in their browser, OR `localStorage` is unavailable. Check the browser's site settings; this is expected behavior for the privacy-strict configuration.

### `/states/[code]` delegation sidebar is empty

`Representative.state` is stored as the full name ("California") but you're filtering by 2-letter code. Always use `abbrToName(code)` from `lib/utils/state-codes.ts`.

---

## Security incidents

If you suspect a breach (unauthorized DB access, leaked credentials, unusual log activity):

1. **Rotate credentials immediately**:
   - Supabase service role key (Settings → API)
   - Clerk secret key (Settings → API keys → revoke + create new)
   - Anthropic API key (Console → API keys)
   - `CRON_SECRET` (Vercel env vars)
2. **Assess scope** — what data was potentially exposed, when, by whom
3. **Notify within 72 hours** (GDPR) if EU/UK user data is potentially affected:
   - The relevant Data Protection Authority
   - Affected users (if high risk)
4. **Document everything** — timeline, scope, actions taken
5. **Post-mortem** — root cause, prevention measures, update this runbook

Mailbox for handling: `privacy@democracyunlocked.com` (set up before launch).

---

## Useful commands cheat-sheet

```bash
# Local dev
npm run dev                          # start dev server
npm run build                        # production build (replicates Vercel)
npm run lint                         # lint check
npm run check:model                  # verify Claude model still live

# Prisma
prisma studio                        # GUI to browse + edit DB rows locally
prisma generate                      # regenerate client after schema change
prisma migrate dev --name <name>     # create + apply migration locally
prisma migrate deploy                # apply pending migrations (use with care; see above)
prisma db pull                       # compare schema.prisma against actual DB

# Asset prep
python3 scripts/prepare-logo.py      # generate all logo derivatives + favicon

# Git
git log --oneline -- path/to/file    # history of a single file
git log --all --grep="<pattern>"     # search commit messages

# Vercel (via CLI if installed)
vercel logs --prod                   # tail production logs
vercel env ls                        # list configured env vars
```
