# NEON21 — CIS Intelligence System

> AI-powered blackjack decision support by Syndicate Supremacy

## Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Animations | Framer Motion |
| Database / Auth | Supabase |
| Payments | Square |
| Card OCR | Tesseract.js |
| Voice Control | Web Speech API |
| State | Zustand |
| Deployment | Vercel |

## Features

- **Card Counting Systems**: Hi-Lo, KO (Knockout), Hi-Opt II
- **Deck Configurations**: 2, 6, or 8 decks
- **True Count Conversion** with Illustrious 18 index play deviations
- **Kelly Criterion Bet Sizing** with adjustable fraction
- **Basic Strategy Engine** — hard, soft, and pair decisions
- **Pattern Detection** — dealer bias, shuffle tracking, hot/cold streaks
- **Voice Commands** — speak card names or actions
- **Camera Card Scan** — Tesseract.js OCR (2-second polling)
- **Monetization** — 1-hour free trial, then $9.99/month via Square

## Quick Start

```bash
npm install
cp .env.example .env.local    # fill in your credentials
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Square Payments
SQUARE_ACCESS_TOKEN=your-access-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_PLAN_VARIATION_ID=your-plan-variation-id
SQUARE_PREMIUM_PLAN_VARIATION_ID=your-premium-plan-variation-id  # optional
SQUARE_ENV=sandbox   # or "production"
```

## Supabase Setup

Run the SQL schema from `config/schema.sql` in your Supabase SQL editor to create
the `profiles` table with Row Level Security and auto-triggers.

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel project settings (see above)
4. Deploy — Vercel automatically detects Next.js

The `vercel.json` at root pre-configures the build command and output directory.

## API Routes

All engine routes are serverless-compatible (no Express required):

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/engine/count` | POST | Add card(s) to running count |
| `/api/engine/count` | DELETE | Undo last card |
| `/api/engine/reset` | POST | Reset shoe (new shuffle) |
| `/api/engine/predict` | POST | Get basic strategy + count-adjusted recommendation |
| `/api/square` | POST | Process Square subscription payment |
| `/api/subscribe` | POST | Subscribe to a plan (basic or premium) |

## Security

- Helmet.js security headers via `next.config.ts`
- Supabase Row Level Security (users see only their own data)
- Payment processing server-side only — tokens never exposed to frontend
- Auth middleware protects `/dashboard`, `/game`, `/engine` routes

## Architecture Note

The engine runs entirely as Next.js serverless API routes — no separate Express server needed.
Session state is maintained in-memory per serverless instance. For multi-instance production
deployments, consider migrating session state to Supabase or Redis.

<!-- deploy trigger -->
