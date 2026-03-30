# 🧠 MemorAI — The Memory Layer Above All Your Apps

AI-powered personal memory assistant — reminders, lists, calendar, memory vault, email, and voice — all through one chat interface.

![Stack](https://img.shields.io/badge/Stack-100%25%20Free-green)
![React](https://img.shields.io/badge/React-18-blue)
![Supabase](https://img.shields.io/badge/Supabase-Free%20Tier-green)
![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-orange)

## ✨ Features

- 💬 **AI Chat** — Natural language interface powered by Gemini 2.0 Flash
- ⏰ **Smart Reminders** — Set, snooze, recurring reminders via chat or UI
- 📝 **Smart Lists** — Drag-and-drop reorderable lists
- 📅 **Calendar Sync** — Google Calendar integration
- 🗄️ **Memory Vault** — File storage with AI-powered semantic search
- 📧 **Email Integration** — Gmail with AI classification and drafting
- 🎤 **Voice Input** — Speak reminders (Groq Whisper transcription)
- 🖼️ **Image Intelligence** — Extract tasks from photos
- ☀️ **Daily Briefing** — AI-generated morning summaries
- 🔔 **Push Notifications** — Browser notifications for reminders
- 📱 **PWA** — Installable as a native app

## 🛠️ Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Frontend | React 18 + Vite + TailwindCSS | Free |
| State | Zustand | Free |
| Backend | Supabase (DB, Auth, Storage) | Free tier |
| AI Chat | Gemini 2.0 Flash | Free |
| AI Vision | Gemini 1.5 Flash | Free |
| Embeddings | Gemini text-embedding-004 | Free |
| Voice | Groq Whisper Large v3 | Free |
| Vectors | pgvector (Supabase) | Free |
| Calendar | Google Calendar API | Free |
| Email | Gmail API + Resend | Free |
| Push | Web Push API | Free |
| Hosting | Vercel | Free |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/audentix/memoryAI.git
cd memoryAI
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL Editor
3. Enable Google OAuth in **Authentication > Providers**
4. Enable the **pgvector** extension in **Database > Extensions**
5. Create a storage bucket named `memories` (public)

### 3. Get API Keys

- **Gemini**: [aistudio.google.com](https://aistudio.google.com) → Create API key
- **Groq**: [console.groq.com](https://console.groq.com) → Create API key
- **Resend**: [resend.com](https://resend.com) → Create API key

### 4. Configure Environment

```bash
cp .env.example .env
# Fill in your keys
```

### 5. Run

```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── lib/              # API clients & utilities
│   ├── supabaseClient.js
│   ├── gemini.js
│   ├── groqClient.js
│   ├── googleCalendar.js
│   ├── gmailClient.js
│   ├── vectorSearch.js
│   └── webPush.js
├── store/            # Zustand state management
│   ├── useAuthStore.js
│   ├── useChatStore.js
│   ├── useReminderStore.js
│   ├── useListStore.js
│   ├── useMemoryStore.js
│   └── useSettingsStore.js
├── hooks/            # Custom React hooks
│   ├── useVoiceInput.js
│   ├── useNotifications.js
│   └── useRealtimeSync.js
├── components/
│   ├── layout/       # App shell (Sidebar, TopBar, MobileNav)
│   └── shared/       # Reusable UI (Modal, Button, Toast, etc.)
├── pages/            # Route pages
│   ├── LandingPage.jsx
│   ├── AuthPage.jsx
│   ├── OnboardingPage.jsx
│   ├── DashboardPage.jsx
│   ├── ChatPage.jsx
│   ├── RemindersPage.jsx
│   ├── ListsPage.jsx
│   ├── CalendarPage.jsx
│   ├── MemoryTrunkPage.jsx
│   ├── EmailPage.jsx
│   └── SettingsPage.jsx
└── App.jsx           # Root router
```

## 📋 Build Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Supabase setup, Auth, Onboarding | ⬜ |
| 2 | App layout, Sidebar, routing | ⬜ |
| 3 | Chat page + Gemini intent pipeline | ⬜ |
| 4 | Reminders CRUD + page | ⬜ |
| 5 | Lists CRUD + drag-and-drop | ⬜ |
| 6 | Dashboard with widgets | ⬜ |
| 7 | Voice input (Groq Whisper) | ⬜ |
| 8 | Image analysis (Gemini Vision) | ⬜ |
| 9 | Long-term memory + pgvector | ⬜ |
| 10 | Google Calendar integration | ⬜ |
| 11 | Memory Trunk + semantic search | ⬜ |
| 12 | Push notifications + cron | ⬜ |
| 13 | Daily briefing | ⬜ |
| 14 | Gmail integration + Email page | ⬜ |
| 15 | Settings page | ⬜ |
| 16 | Landing page + PWA manifest | ⬜ |
| 17 | Polish, error handling, empty states | ⬜ |

## 📄 License

MIT
