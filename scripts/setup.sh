#!/bin/bash

echo "🚀 Workplace MVP - Quick Start Script"
echo "====================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set your:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - NEXTAUTH_SECRET (run: openssl rand -base64 32)"
    echo "   - OPENAI_API_KEY (optional - will use stubs if not set)"
    echo ""
    read -p "Press Enter after you've updated .env..."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup database"
    echo "Make sure PostgreSQL is running and DATABASE_URL is correct in .env"
    exit 1
fi

echo ""
echo "🌱 Seeding database with demo data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📧 Demo accounts (password: password123):"
echo "   Executive: exec@workplace.com"
echo "   Manager:   manager@workplace.com"
echo "   Employee:  alice@workplace.com"
echo ""
echo "🚀 Starting development server..."
echo "   URL: http://localhost:3000"
echo ""

npm run dev
