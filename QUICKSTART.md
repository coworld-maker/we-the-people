# 🚀 Quick Start Guide - We The People

Get your civic engagement platform running in **15 minutes**!

## Step 1: Get Your Accounts Ready (5 minutes)

### Required Accounts:
1. **GitHub** - [github.com](https://github.com)
2. **Vercel** - [vercel.com](https://vercel.com) (sign in with GitHub)
3. **Clerk** - [clerk.com](https://clerk.com)
4. **Database** - Choose one:
   - Vercel Postgres (easiest if using Vercel)
   - Supabase - [supabase.com](https://supabase.com)
   - Neon - [neon.tech](https://neon.tech)
5. **Congress API** - [api.congress.gov/sign-up](https://api.congress.gov/sign-up/)

## Step 2: Get Your API Keys (5 minutes)

### Clerk Setup
1. Go to [clerk.com](https://clerk.com/dashboard)
2. Create new application → "We The People"
3. Copy these keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_`)
   - `CLERK_SECRET_KEY` (starts with `sk_`)

### Database Setup (Choose One)

**Vercel Postgres:**
```
1. Create Vercel project
2. Go to Storage → Create Database → Postgres
3. Copy connection string
```

**Supabase:**
```
1. New Project → "We The People"
2. Settings → Database → Connection Pooling
3. Copy connection string
```

**Neon:**
```
1. New Project → "We The People"
2. Copy connection string from dashboard
```

### Congress API
1. Visit [api.congress.gov/sign-up](https://api.congress.gov/sign-up/)
2. Enter email, get API key instantly
3. Copy your API key

## Step 3: Deploy to Vercel (5 minutes)

### Option A: Deploy with One Click (Fastest)

1. Push this code to your GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variables (see below)
5. Click Deploy!

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

## Step 4: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
# Database
DATABASE_URL=your_database_url_here

# Clerk (from clerk.com/dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Congress API
CONGRESS_API_KEY=your_api_key

# Security Keys (generate these!)
ENCRYPTION_KEY=run_command_below_to_generate
ANONYMIZATION_SALT=run_command_below_to_generate
CRON_SECRET=run_command_below_to_generate

# App Settings
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

**Generate Security Keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run this command 3 times to generate ENCRYPTION_KEY, ANONYMIZATION_SALT, and CRON_SECRET.

## Step 5: Update Clerk Settings

After deployment:

1. Go to Clerk Dashboard
2. Your Application → Settings
3. **Allowed Origins** → Add:
   ```
   https://your-domain.vercel.app
   ```
4. **Paths** → Update:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`
5. Save changes

## Step 6: Sync Initial Data

1. Visit your deployed site
2. Sign up for an account
3. Go to `https://your-domain.vercel.app/api/sync`
4. Wait for bills to sync (may take 30-60 seconds)

## ✅ You're Done!

Your platform is live! Users can now:
- Sign up and log in
- Browse congressional bills
- Cast votes
- Track their voting history
- See public opinion statistics

## Troubleshooting

### "Authentication error"
→ Check Clerk redirect URLs match your Vercel domain

### "Database connection error"
→ Ensure DATABASE_URL includes `?pgbouncer=true`

### "No bills showing"
→ Visit `/api/sync` while logged in to sync bills

### "Encryption error"
→ Verify ENCRYPTION_KEY is exactly 64 hex characters

## Next Steps

- ✅ Test all features
- ✅ Invite users to try it
- ✅ Monitor Vercel logs for errors
- ✅ Bills sync automatically daily at 2 AM
- ✅ Add custom domain (optional)

## Support

Issues? Check:
1. Vercel deployment logs
2. Browser console for errors
3. DEPLOYMENT_CHECKLIST.md for detailed steps
4. README.md for full documentation

---

**Total Time:** ~15 minutes
**Cost:** $0 (all free tiers)
**Complexity:** ⭐⭐☆☆☆ (Moderate)

Happy Voting! 🗳️🇺🇸
