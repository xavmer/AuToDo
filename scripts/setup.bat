@echo off
echo 🚀 Workplace MVP - Quick Start Script
echo =====================================
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    copy .env.example .env
    echo ✅ Created .env file
    echo.
    echo ⚠️  IMPORTANT: Edit .env and set your:
    echo    - DATABASE_URL (PostgreSQL connection string^)
    echo    - NEXTAUTH_SECRET (run: openssl rand -base64 32^)
    echo    - OPENAI_API_KEY (optional - will use stubs if not set^)
    echo.
    pause
)

echo.
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo 🗄️  Setting up database...
call npx prisma generate
call npx prisma db push

if %errorlevel% neq 0 (
    echo ❌ Failed to setup database
    echo Make sure PostgreSQL is running and DATABASE_URL is correct in .env
    exit /b 1
)

echo.
echo 🌱 Seeding database with demo data...
call npm run db:seed

if %errorlevel% neq 0 (
    echo ❌ Failed to seed database
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo 📧 Demo accounts (password: password123^):
echo    Executive: exec@workplace.com
echo    Manager:   manager@workplace.com
echo    Employee:  alice@workplace.com
echo.
echo 🚀 Starting development server...
echo    URL: http://localhost:3000
echo.

call npm run dev
