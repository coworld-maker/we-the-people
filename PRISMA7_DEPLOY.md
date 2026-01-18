# 🚀 PRISMA 7 COMPATIBLE VERSION - Deploy Guide

## ✅ What's Updated for Prisma 7

Prisma 7 has breaking changes in how it handles database connections. This version is fully compatible:

1. **Removed `url` from schema.prisma** - Prisma 7 requirement
2. **Added prisma.config.ts** - New Prisma 7 config file
3. **Updated PrismaClient** - Now uses `datasourceUrl` parameter
4. **Latest dependencies** - Prisma 7.2.0, Next.js 15.1.6

## 🎯 Deploy Steps

### Step 1: Update Your GitHub Repository

```bash
# Extract the new version
tar -xzf we-the-people-prisma7.tar.gz
cd we-the-people

# Push to GitHub
git add .
git commit -m "Update to Prisma 7 compatible version"
git push origin main
```

### Step 2: Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

**Add these (copy-paste exactly):**

```env
DATABASE_URL=postgresql://postgres.hiypdaqcpssqlwtgprmf:HTN.Holdings4%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Zml0LXNxdWlkLTUuY2xlcmsuYWNjb3VudHMuZGV2JA

CLERK_SECRET_KEY=sk_test_InYXxdAJcLFmBdEwa7uDGxjsGvOAANc2lOEoVwXGCA

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

CONGRESS_API_KEY=ouoaof5H0DebcZPLy5fLW3v9omwBmRMpI36Sv2V9

ENCRYPTION_KEY=a3ca3a3c11ac92ee06cc0aff3506a6f2403d6d5a94dd843f45d7bd003a3b05c0

ANONYMIZATION_SALT=d56ed2b5b33aee963fe8656fe9440b3aae2f3758a05383297cb2b61db3cac6fe

CRON_SECRET=29a4f24c72f2c34bdae63d2106452220e9989f195a15872222a67f6cedac38df

NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

NODE_ENV=production
```

**Critical:**
- `!` is encoded as `%21` in DATABASE_URL
- Must end with `?pgbouncer=true`

### Step 3: Deploy

1. Vercel will auto-deploy from GitHub
2. Or manually: **Deployments** → **Redeploy**

### Step 4: Initialize Database

After successful build, run the migration **once**:

**Option A: Supabase SQL Editor** (Easiest)
```
1. Supabase Dashboard → SQL Editor
2. New Query
3. Paste contents from: prisma/migrations/20250117000000_init/migration.sql
4. Run
```

**Option B: Local Terminal**
```bash
export DATABASE_URL="postgresql://postgres.hiypdaqcpssqlwtgprmf:HTN.Holdings4%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma migrate deploy
```

### Step 5: Post-Deployment

1. **Update App URL**:
   - Copy your Vercel URL
   - Update `NEXT_PUBLIC_APP_URL` in Vercel
   - Redeploy

2. **Update Clerk**:
   - Clerk Dashboard → Domains
   - Add Vercel URL to Allowed Origins

3. **Sync Bills**:
   - Sign up on your site
   - Visit: `https://your-app.vercel.app/api/sync`

## ✅ What Changed for Prisma 7

### Before (Prisma 5/6):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  ← This is removed
}
```

### After (Prisma 7):
```prisma
datasource db {
  provider = "postgresql"  ← No url here
}
```

**New file: `prisma/prisma.config.ts`**
```typescript
export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,  ← Moved here
    },
  },
})
```

**Updated: `lib/prisma.ts`**
```typescript
new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,  ← Now passed to client
})
```

## 📋 Files Changed

- ✅ `prisma/schema.prisma` - Removed `url` field
- ✅ `prisma/prisma.config.ts` - NEW file for Prisma 7
- ✅ `lib/prisma.ts` - Updated client initialization
- ✅ `package.json` - Prisma 7.2.0 + Next.js 15.1.6

## 🐛 Expected Build Output

```
✓ Installing dependencies
✓ Prisma schema loaded
✓ Generated Prisma Client (v7.2.0)
✓ No update warnings
✓ Next.js compiled
✓ Build completed successfully
```

## 🎯 Version Info

- **Prisma**: 7.2.0 ✅
- **Next.js**: 15.1.6 ✅
- **Clerk**: 5.0.0 ✅
- **React**: 18.3.1 ✅

## 🔧 Troubleshooting

**"The datasource property `url` is no longer supported"**
→ You're using old version. Download and use this new archive.

**"Authentication failed"**
→ Check DATABASE_URL has `%21` not `!` and ends with `?pgbouncer=true`

**Build succeeds but runtime errors**
→ Run database migration (Step 4)

---

**This version is fully Prisma 7 compatible!** 🚀

Deploy and it should work without warnings.
