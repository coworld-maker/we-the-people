# We The People - Democracy Unlocked 🇺🇸

A modern civic engagement platform that allows citizens to vote on real congressional legislation, track bills, and make their voices heard in democracy.

## Features

- 🗳️ **Vote on Real Legislation** - Cast votes on actual congressional bills
- 🔒 **End-to-End Encryption** - Your personal data and votes are encrypted
- 📊 **Real-Time Statistics** - See how public opinion shapes up on each bill
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔄 **Automated Sync** - Daily updates from Congress.gov API
- 👤 **Anonymous Voting** - Option to keep your votes private
- 📈 **Personal Dashboard** - Track your voting history and engagement

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** Clerk
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **APIs:** Congress.gov Official API

## Prerequisites

Before you begin, make sure you have:

- Node.js 18+ installed
- A GitHub account
- A Vercel account
- A Clerk account (free tier works)
- A PostgreSQL database (Vercel Postgres, Supabase, or Neon)
- A Congress.gov API key

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd we-the-people
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your `.env` file with the following:

```env
# Database - Get from Vercel, Supabase, or Neon
DATABASE_URL="postgresql://user:password@host:5432/postgres?pgbouncer=true"

# Clerk Authentication - Get from clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Congress API - Get from api.congress.gov
CONGRESS_API_KEY="your_api_key_here"

# Security Keys - Generate using the command below
ENCRYPTION_KEY="your_64_char_hex_key"
ANONYMIZATION_SALT="your_64_char_hex_key"
CRON_SECRET="your_random_secret"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Generate Security Keys:**

```bash
# Generate ENCRYPTION_KEY and ANONYMIZATION_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Getting API Keys

### Congress.gov API Key

1. Visit [api.congress.gov](https://api.congress.gov/sign-up/)
2. Sign up for a free API key
3. Copy your API key to `.env`

### Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your publishable and secret keys
4. In Clerk Dashboard:
   - Go to "Email, Phone, Username" settings
   - Enable "Email" authentication
   - Configure redirect URLs to match your domain

### Database Setup

**Option 1: Vercel Postgres (Recommended for Vercel deployment)**

1. Go to your Vercel project
2. Navigate to Storage tab
3. Create a new Postgres database
4. Copy the connection string

**Option 2: Supabase**

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection pooling" for production)

**Option 3: Neon**

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

## Deployment to Vercel

### Method 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all environment variables from `.env`
4. Deploy!

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# ... add all other env vars

# Deploy to production
vercel --prod
```

### Post-Deployment Steps

1. **Update Clerk URLs:**
   - Go to Clerk Dashboard
   - Update redirect URLs to your Vercel domain
   - Update "Allowed origins" to include your domain

2. **Initial Bill Sync:**
   - Visit `https://your-domain.vercel.app/api/sync` (requires authentication)
   - Or wait for the daily cron job at 2 AM

3. **Set Up Cron Job:**
   - Vercel automatically configures the cron job from `vercel.json`
   - Verify in Vercel Dashboard → Settings → Cron Jobs

## Project Structure

```
we-the-people/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   └── bills/
│   ├── api/
│   │   ├── votes/
│   │   ├── bills/
│   │   ├── sync/
│   │   └── cron/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── voting/
│       └── VotingPanel.tsx
├── lib/
│   ├── api/
│   │   └── congress.ts
│   ├── services/
│   │   ├── userService.ts
│   │   ├── billService.ts
│   │   └── voteService.ts
│   ├── security/
│   │   ├── encryption.ts
│   │   └── validation.ts
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
└── ...config files
```

## Features in Detail

### Bill Syncing

- Automatic daily sync at 2 AM via Vercel Cron
- Fetches latest bills from Congress.gov
- Stores bill metadata, sponsors, and actions
- Manual sync available via `/api/sync` endpoint

### Voting System

- Three options: Yes, No, Abstain
- Optional reasoning (up to 500 characters)
- Anonymous by default (user can choose to make vote public)
- Vote aggregation with real-time statistics
- Ability to update votes

### Security

- All sensitive data encrypted with AES-256-GCM
- Email addresses hashed for privacy
- IP addresses hashed for audit trails
- Vote reasoning encrypted end-to-end
- Comprehensive audit logging

### User Dashboard

- Vote statistics (total, yes, no, abstain)
- Recent voting history
- Bill tracking
- Profile customization

## API Endpoints

- `GET /api/bills` - List all bills with filters
- `GET /api/bills/[id]` - Get bill details
- `POST /api/votes` - Cast or update a vote
- `GET /api/votes` - Get user's votes
- `DELETE /api/votes` - Delete a vote
- `POST /api/sync` - Manually sync bills (requires auth)
- `GET /api/cron/sync` - Automated sync (requires secret)

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CONGRESS_API_KEY` | Yes | Congress.gov API key |
| `ENCRYPTION_KEY` | Yes | 64-char hex key for encryption |
| `ANONYMIZATION_SALT` | Yes | 64-char hex key for hashing |
| `CRON_SECRET` | Yes | Secret for cron job authentication |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's URL |
| `NODE_ENV` | Yes | `development` or `production` |

## Troubleshooting

### Database Connection Issues

- Ensure your DATABASE_URL includes `?pgbouncer=true` for connection pooling
- Check that your database allows connections from Vercel IPs
- Verify SSL settings are correct

### Clerk Authentication Issues

- Verify all redirect URLs in Clerk Dashboard match your domain
- Ensure environment variables are set correctly
- Check that Clerk middleware is properly configured

### Congress API Issues

- Verify your API key is valid
- Check rate limits (1000 requests/hour)
- Ensure API endpoint is accessible

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review Vercel deployment logs

## Acknowledgments

- Congress.gov for providing the API
- Clerk for authentication
- Vercel for hosting
- The open-source community

---

Made with ❤️ for democracy
