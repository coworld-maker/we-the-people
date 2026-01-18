#!/bin/bash

# We The People - Setup Script
# This script helps you set up the project quickly

set -e

echo "🇺🇸 We The People - Setup Script"
echo "=================================="
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18 or higher is required"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env and add your credentials:"
    echo "   1. Database URL (Vercel Postgres, Supabase, or Neon)"
    echo "   2. Clerk keys (from clerk.com)"
    echo "   3. Congress API key (from api.congress.gov)"
    echo ""
    echo "Generate encryption keys with:"
    echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo ""
    read -p "Press Enter after you've updated .env..."
fi

echo "✅ .env file exists"
echo ""

# Generate encryption keys if not set
if ! grep -q "ENCRYPTION_KEY=\"[a-f0-9]\{64\}\"" .env; then
    echo "🔐 Generating encryption keys..."
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    ANONYMIZATION_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update .env file
    sed -i.bak "s/ENCRYPTION_KEY=\"\"/ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"/" .env
    sed -i.bak "s/ANONYMIZATION_SALT=\"\"/ANONYMIZATION_SALT=\"$ANONYMIZATION_SALT\"/" .env
    sed -i.bak "s/CRON_SECRET=\"\"/CRON_SECRET=\"$CRON_SECRET\"/" .env
    rm .env.bak
    
    echo "✅ Encryption keys generated"
else
    echo "✅ Encryption keys already set"
fi
echo ""

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=\"postgresql://" .env; then
    echo "⚠️  DATABASE_URL not configured"
    echo "Please add your PostgreSQL connection string to .env"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL configured"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
echo "This will create all necessary tables..."
npx prisma migrate dev --name init
echo "✅ Database migrations complete"
echo ""

echo "=================================="
echo "🎉 Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Visit http://localhost:3000"
echo ""
echo "3. Sign up for an account"
echo ""
echo "4. Manually sync bills (as authenticated user):"
echo "   Visit http://localhost:3000/api/sync"
echo ""
echo "Ready to deploy?"
echo "- Push to GitHub"
echo "- Import to Vercel"
echo "- Add environment variables"
echo "- Deploy!"
echo ""
echo "See README.md for detailed deployment instructions"
echo ""
