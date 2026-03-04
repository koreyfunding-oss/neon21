# NEON21 — CIS Intelligence System
**AI-powered blackjack decision support by Syndicate Supremacy**

## Stack
- **Frontend**: Next.js 15, React 19, Tailwind 4, Framer Motion
- **Backend Engine**: Express.js (runs as separate service or serverless)
- **Auth + DB**: Supabase
- **Payments**: Square (Apple Pay, Google Pay, Credit Card)
- **Card Scan**: Tesseract.js OCR (continuous polling, detects new cards)
- **Voice Control**: Web Speech API (hands-free from pocket)
- **Deploy**: Vercel

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set environment variables
Copy `.env.example` to `.env.local` and fill in your keys:
```bash
cp .env.example .env.local
```

### 3. Set up Supabase
- Create a project at supabase.com
- Run `config/schema.sql` in the SQL editor
- Enable email confirmation in Auth settings
- Copy your URL and anon key to `.env.local`

### 4. Set up Square
- Create app at developer.squareup.com
- Create a subscription plan ($9.99/month)
- Copy Access Token, Location ID, Plan Variation ID to `.env.local`
- Set `SQUARE_ENV=sandbox` for testing, `production` when live

### 5. Run locally
```bash
# Next.js frontend (port 3000)
npm run dev

# Engine backend (port 3001) — in separate terminal
npm run engine
```

### 6. Deploy to Vercel
```bash
# Push to GitHub — Vercel auto-deploys
git add .
git commit -m "NEON21 v2"
git push

# Set env vars in Vercel dashboard under Settings > Environment Variables
```

## Features

### Card Counting Systems
- **Hi-Lo**: Standard balanced system
- **KO (Knockout)**: Unbalanced, no true count conversion needed
- **Hi-Opt II**: Advanced multi-level for experienced counters

### Deck Configuration
- 2, 6, or 8 decks (configurable per session)

### Voice Commands
Activate voice mode, then say:
- Card names: `"king"`, `"five"`, `"ace"` → logs card
- Actions: `"hit"`, `"stand"`, `"double"` → records decision
- `"reset"` or `"shuffle"` → resets the shoe

### Screen Scan
- Point camera at table — new cards detected every 2 seconds
- Tesseract OCR with contrast enhancement
- Deduplication prevents double-counting same card

### Paywall
- 1-hour free trial
- Warning toasts at 5min and 2min remaining
- Square subscription ($9.99/month) — Apple Pay, Google Pay, card
- Payment URLs NEVER exposed to frontend — server-side only

## Security
- Helmet.js headers
- Rate limiting (300 req/min per IP)
- Session-based state (no sensitive data in client)
- Square payment processing fully server-side
- Row Level Security on all Supabase tables
