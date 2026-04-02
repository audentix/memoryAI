# MemorAI — Setup Guide

A complete step-by-step guide to get MemorAI running locally or in production.

---

## Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Node.js | 18+ | ✅ |
| npm | 9+ | ✅ |
| Git | 2.x | ✅ |
| Supabase Account | Free tier | ✅ |
| Google Cloud Account | Free tier | ✅ |
| Gemini API Key | Free tier | ✅ |
| Groq API Key | Free tier | ✅ |

---

## Quick Start (5 minutes)

### 1. Clone the repo
```bash
git clone https://github.com/audentix/memoryAI.git
cd memoryAI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your API keys (see below).

### 4. Start development server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# ============================================
# SUPABASE (Required)
# ============================================
# Get these from: https://supabase.com → Your Project → Settings → API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# ============================================
# GEMINI AI (Required)
# ============================================
# Get from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your-gemini-key

# ============================================
# GROQ WHISPER (Required for voice)
# ============================================
# Get from: https://console.groq.com/keys
VITE_GROQ_API_KEY=your-groq-key

# ============================================
# GOOGLE OAUTH (Optional - for Calendar + Gmail)
# ============================================
# 1. Go to https://console.cloud.google.com/apis/credentials
# 2. Create OAuth 2.0 Client ID
# 3. Add authorized redirect: http://localhost:5173/auth/callback
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# ============================================
# RESEND (Optional - for email)
# ============================================
# Get from: https://resend.com
VITE_RESEND_API_KEY=your-resend-key

# ============================================
# PWA PUSH (Optional)
# ============================================
# Generate with: npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
# (Private key goes in your Supabase Edge Function)

# ============================================
# APP CONFIG
# ============================================
VITE_APP_URL=http://localhost:5173
```

---

## Step-by-Step Setup

### Step 1: Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → Fill in details
3. Wait for database to provision

#### Run the database schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste and run

This creates:
- 11 tables (profiles, reminders, lists, list_items, memories, files, chat_messages, calendar_connections, email_connections, friend_reminders, daily_briefings)
- Row Level Security (RLS) policies
- pgvector extension for semantic search

#### Get Supabase credentials
1. Go to **Settings → API**
2. Copy **Project URL** → `VITE_SUPABASE_URL`
3. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

#### Create storage bucket
1. Go to **Storage** → **New Bucket**
2. Name: `memories`
3. Enable **Public bucket**
4. Add RLS policies for authenticated users

---

### Step 2: Google OAuth (Calendar + Gmail)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID**
3. Set **Authorized redirect URIs**:
   - `http://localhost:5173/auth/callback`
   - `https://your-domain.auth.supabase.co/auth/v1/callback`
4. Copy **Client ID** → `VITE_GOOGLE_CLIENT_ID`

#### Enable Google OAuth in Supabase
1. Go to Supabase **Authentication → Providers**
2. Enable **Google**
3. Add your Client ID and Client Secret

---

### Step 3: Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Copy to `VITE_GEMINI_API_KEY`

**Note:** Gemini free tier includes:
- 1M tokens/day
- 1500 requests/day

---

### Step 4: Groq API Key (Voice)

1. Go to [Groq Console](https://console.groq.com/keys)
2. Create API key
3. Copy to `VITE_GROQ_API_KEY`

**Note:** Groq free tier includes:
- 6000 minutes/month Whisper transcription

---

### Step 5: Resend (Optional - Email)

1. Go to [Resend.com](https://resend.com)
2. Create account and verify domain
3. Copy API key to `VITE_RESEND_API_KEY`

---

## Production Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

Add your environment variables in Vercel dashboard.

### Alternative: Deploy to Netlify

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

---

## Supabase Edge Functions (Optional)

For push notifications and cron jobs:

### 1. Enable Edge Functions
```bash
npm install -g supabase
supabase functions new send-reminders
```

### 2. Deploy functions
```bash
# Set environment
export SUPABASE_URL=your-project-url
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy
supabase functions deploy send-reminders
```

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check your `.env` file exists and has correct values
- Restart dev server after changes: `npm run dev`

### "Failed to fetch calendar events"
- Verify Google OAuth is configured in Supabase
- Check `VITE_GOOGLE_CLIENT_ID` is correct

### "Push notifications not working"
- Generate VAPID keys: `npx web-push generate-vapid-keys`
- Add public key to `.env`
- Add private key to Edge Function

### "Build errors"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "RLS policy errors"
- Go to Supabase SQL Editor
- Run `supabase-schema.sql` again
- Check policies are enabled

---

## Project Structure

```
memorai/
├── src/
│   ├── components/       # React components
│   │   ├── calendar/     # Calendar components
│   │   ├── chat/         # Chat components
│   │   ├── email/        # Email components
│   │   ├── layout/       # App layout
│   │   ├── lists/        # List components
│   │   ├── memory/       # Memory vault components
│   │   ├── onboarding/   # Onboarding steps
│   │   ├── reminders/     # Reminder components
│   │   └── shared/        # Reusable components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # API clients & utilities
│   ├── pages/            # Route pages
│   ├── store/            # Zustand state stores
│   └── App.jsx           # Root router
├── public/
│   ├── manifest.json    # PWA manifest
│   └── service-worker.js # Push notifications
├── supabase-schema.sql  # Database schema
├── .env.example          # Environment template
└── package.json
```

---

## Technology Stack

| Layer | Tool |
|-------|------|
| Frontend | React 18 + Vite + TailwindCSS |
| State | Zustand |
| Backend | Supabase (DB, Auth, Storage, Edge Functions) |
| AI Chat | Gemini 2.0 Flash |
| AI Vision | Gemini 1.5 Flash |
| Embeddings | Gemini text-embedding-004 |
| Voice | Groq Whisper Large v3 |
| Vectors | pgvector |
| Calendar | Google Calendar API |
| Email | Gmail API + Resend |
| Push | Web Push API |
| Hosting | Vercel (free tier) |

---

## License

MIT — Use freely for personal or commercial projects.