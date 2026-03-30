#!/bin/bash
# ============================================
# MemorAI — Push to GitHub & Create Issues
# ============================================
# Run this from your LOCAL machine after cloning the repo
#
# Usage:
#   1. Copy the memorai/ folder into your cloned memoryAI repo
#   2. Run: bash push-and-setup.sh <GITHUB_TOKEN>
#
# The script will:
#   - Push all code to main branch
#   - Create 17 GitHub issues (one per phase)
#   - Set up labels for tracking
# ============================================

set -e

REPO="audentix/memoryAI"
TOKEN="${1:-}"

if [ -z "$TOKEN" ]; then
  echo "❌ Usage: bash push-and-setup.sh <GITHUB_TOKEN>"
  echo "   Generate one at: https://github.com/settings/tokens/new (repo scope)"
  exit 1
fi

# Configure git auth
git config credential.helper ""
echo "https://audentix:${TOKEN}@github.com" > /tmp/git-creds
git config credential.helper "store --file=/tmp/git-creds"

echo "📦 Pushing code to GitHub..."
git add -A
git commit -m "feat: complete MemorAI scaffold — all 17 phases

Full-stack AI memory assistant:
- React 18 + Vite + TailwindCSS
- Supabase (DB, Auth, Storage, RLS, pgvector)
- Gemini 2.0 Flash + Vision + Embeddings
- Groq Whisper voice transcription
- Google Calendar & Gmail integration
- PWA with push notifications

63 files | 12 pages | 10+ DB tables | Zustand stores | Custom hooks" || true

git push -u origin main --force

echo ""
echo "✅ Code pushed!"
echo ""

# ============================================
# CREATE LABELS
# ============================================
echo "🏷️  Creating labels..."

API="https://api.github.com/repos/${REPO}"
AUTH="Authorization: token ${TOKEN}"

create_label() {
  local name="$1" color="$2" desc="$3"
  curl -s -X POST "${API}/labels" \
    -H "${AUTH}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${name}\",\"color\":\"${color}\",\"description\":\"${desc}\"}" \
    > /dev/null 2>&1 || true
}

create_label "phase-1" "1a7f34" "Supabase setup, Auth, Onboarding"
create_label "phase-2" "2563eb" "App layout, Sidebar, routing"
create_label "phase-3" "7c3aed" "Chat page + Gemini intent pipeline"
create_label "phase-4" "dc2626" "Reminders CRUD + page"
create_label "phase-5" "ea580c" "Lists CRUD + drag-and-drop"
create_label "phase-6" "ca8a04" "Dashboard with widgets"
create_label "phase-7" "16a34a" "Voice input (Groq Whisper)"
create_label "phase-8" "0891b2" "Image analysis (Gemini Vision)"
create_label "phase-9" "6d28d9" "Long-term memory + pgvector"
create_label "phase-10" "be185d" "Google Calendar integration"
create_label "phase-11" "0d9484" "Memory Trunk file upload + search"
create_label "phase-12" "b45300" "Push notifications + cron"
create_label "phase-13" "475569" "Daily briefing"
create_label "phase-14" "0e7490" "Gmail integration + Email page"
create_label "phase-15" "9333ea" "Settings page"
create_label "phase-16" "1d4ed8" "Landing page + PWA manifest"
create_label "phase-17" "64748b" "Polish, error handling, empty states"

create_label "enhancement" "a2eeef" "New feature or request"
create_label "bug" "d73a4a" "Something isn't working"
create_label "priority-high" "b60205" "High priority"

echo "✅ Labels created!"
echo ""

# ============================================
# CREATE ISSUES (one per phase)
# ============================================
echo "📋 Creating phase issues..."

create_issue() {
  local title="$1" body="$2" label="$3"
  # Escape the body for JSON
  local escaped_body=$(echo "$body" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo "$body")
  curl -s -X POST "${API}/issues" \
    -H "${AUTH}" \
    -H "Content-Type: application/json" \
    -d "{\"title\":$(echo "$title" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo "\"$title\""),\"body\":${escaped_body},\"labels\":[\"${label}\",\"enhancement\"]}" \
    > /dev/null 2>&1
  echo "  ✅ $title"
}

# Phase 1
create_issue "Phase 1: Supabase Setup, Auth & Onboarding" \
"## 🎯 Goal
Set up Supabase project, implement authentication flow, and build the onboarding wizard.

## 📋 Tasks
- [ ] Create Supabase project at supabase.com
- [ ] Run \`supabase-schema.sql\` in SQL editor
- [ ] Enable Google OAuth in Auth > Providers
- [ ] Enable pgvector extension
- [ ] Create storage bucket \`memories\`
- [ ] Configure RLS policies (verify they work)
- [ ] Test email/password signup flow
- [ ] Test Google OAuth flow
- [ ] Build AuthPage with login/signup toggle
- [ ] Build OnboardingPage (5 steps: name, timezone, briefing, notifications, calendar)
- [ ] Create \`useAuthStore\` Zustand store
- [ ] Set up auth state listener (\`onAuthStateChange\`)
- [ ] Test post-auth redirect logic

## 🔗 Files
- \`src/pages/AuthPage.jsx\`
- \`src/pages/AuthCallbackPage.jsx\`
- \`src/pages/OnboardingPage.jsx\`
- \`src/store/useAuthStore.js\`
- \`src/lib/supabaseClient.js\`
- \`supabase-schema.sql\`

## ✅ Done when
- [ ] User can sign up with email/password
- [ ] User can sign in with Google (Calendar + Gmail scopes)
- [ ] Onboarding wizard saves all preferences
- [ ] RLS prevents cross-user data access" \
"phase-1"

# Phase 2
create_issue "Phase 2: App Layout, Sidebar & Routing" \
"## 🎯 Goal
Build the main application shell with responsive sidebar, top bar, mobile navigation, and protected routing.

## 📋 Tasks
- [ ] Build AppLayout with sidebar + content area
- [ ] Build Sidebar with nav items (collapsed/expanded states)
- [ ] Build TopBar with search and profile
- [ ] Build MobileNav bottom navigation
- [ ] Set up React Router with protected routes
- [ ] Implement route guards (redirect to /auth if not logged in)
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Add active route highlighting

## 🔗 Files
- \`src/App.jsx\`
- \`src/components/layout/AppLayout.jsx\`
- \`src/components/layout/Sidebar.jsx\`
- \`src/components/layout/TopBar.jsx\`
- \`src/components/layout/MobileNav.jsx\`

## ✅ Done when
- [ ] Sidebar collapses on desktop toggle
- [ ] Mobile shows bottom nav, sidebar is a drawer
- [ ] Unauthenticated users redirect to /auth
- [ ] All routes render correct pages" \
"phase-2"

# Phase 3
create_issue "Phase 3: AI Chat + Gemini Intent Pipeline" \
"## 🎯 Goal
Build the core chat interface with Gemini 2.0 Flash for natural language intent parsing and action execution.

## 📋 Tasks
- [ ] Build ChatWindow, ChatMessage, ChatInput components
- [ ] Implement Gemini chat API wrapper (\`callGeminiChat\`)
- [ ] Design system prompt for intent extraction
- [ ] Build JSON response parser with fallback
- [ ] Implement intent → action mapping (all 16 intents)
- [ ] Save messages to \`chat_messages\` table
- [ ] Add typing indicator animation
- [ ] Add message copy button
- [ ] Add date separators between messages
- [ ] Test with various natural language inputs

## 🔗 Files
- \`src/pages/ChatPage.jsx\`
- \`src/components/chat/ChatWindow.jsx\`
- \`src/components/chat/ChatMessage.jsx\`
- \`src/components/chat/ChatInput.jsx\`
- \`src/store/useChatStore.js\`
- \`src/lib/gemini.js\`

## ✅ Done when
- [ ] User can send messages and get AI responses
- [ ] "Remind me X" creates a reminder in DB
- [ ] "Create a list" creates a list in DB
- [ ] All 16 intents execute correctly" \
"phase-3"

# Phase 4
create_issue "Phase 4: Reminders CRUD + Page" \
"## 🎯 Goal
Build the full Reminders page with create, edit, snooze, complete, delete, and filtering.

## 📋 Tasks
- [ ] Build ReminderCard component
- [ ] Build ReminderForm modal (create/edit)
- [ ] Build RecurrenceSelector
- [ ] Implement filter tabs (All/Today/Upcoming/Recurring/Completed)
- [ ] Implement snooze dropdown (15min/1hr/3hr/Tomorrow)
- [ ] Implement mark done + delete with confirmation
- [ ] Create \`useReminderStore\` Zustand store
- [ ] Add empty state with helpful suggestions

## 🔗 Files
- \`src/pages/RemindersPage.jsx\`
- \`src/store/useReminderStore.js\`

## ✅ Done when
- [ ] Can create/edit/delete reminders
- [ ] Snooze works correctly
- [ ] Filters show correct subsets
- [ ] Chat-created reminders appear in the page" \
"phase-4"

# Phase 5
create_issue "Phase 5: Lists CRUD + Drag-and-Drop" \
"## 🎯 Goal
Build the Lists page with grid view, detail view, drag-and-drop reordering, and inline editing.

## 📋 Tasks
- [ ] Build ListCard grid component
- [ ] Build ListDetailView with item management
- [ ] Implement drag-and-drop with @dnd-kit
- [ ] Implement inline text editing for items
- [ ] Implement checkbox toggle (done/undone)
- [ ] Implement filter (All/Active/Completed)
- [ ] Implement "Clear completed" button
- [ ] Create \`useListStore\` Zustand store
- [ ] Build new list modal with icon picker

## 🔗 Files
- \`src/pages/ListsPage.jsx\`
- \`src/store/useListStore.js\`

## ✅ Done when
- [ ] Can create/edit/delete lists
- [ ] Drag-and-drop reorders items
- [ ] Inline editing saves on Enter/blur
- [ ] Chat-created lists appear correctly" \
"phase-5"

# Phase 6
create_issue "Phase 6: Dashboard with Widgets" \
"## 🎯 Goal
Build the Dashboard home page with stats cards, briefing, upcoming reminders, active lists, and calendar mini-view.

## 📋 Tasks
- [ ] Build 4 stat cards (Reminders, Lists, Events, Memories)
- [ ] Build Today's Briefing card
- [ ] Build Upcoming Reminders widget
- [ ] Build Quick Chat input bar
- [ ] Build Active Lists widget
- [ ] Build Calendar mini view (7-day strip)
- [ ] Build Recent Memory Trunk widget
- [ ] Add greeting based on time of day

## 🔗 Files
- \`src/pages/DashboardPage.jsx\`

## ✅ Done when
- [ ] Dashboard loads all widget data
- [ ] Clicking widgets navigates to correct pages
- [ ] Quick chat redirects to /chat with prefilled message
- [ ] Greeting changes based on time" \
"phase-6"

# Phase 7
create_issue "Phase 7: Voice Input (Groq Whisper)" \
"## 🎯 Goal
Add voice recording and transcription via Groq Whisper Large v3.

## 📋 Tasks
- [ ] Build \`useVoiceInput\` hook (record/stop/transcribe)
- [ ] Add mic button to ChatInput
- [ ] Show recording indicator (pulsing red dot + timer)
- [ ] Handle transcription and fill into input
- [ ] Test with various accents/languages
- [ ] Handle permission denial gracefully

## 🔗 Files
- \`src/hooks/useVoiceInput.js\`
- \`src/lib/groqClient.js\`
- \`src/pages/ChatPage.jsx\` (mic button)

## ✅ Done when
- [ ] Pressing mic records audio
- [ ] Stopping sends to Groq and fills text
- [ ] Error states handled gracefully" \
"phase-7"

# Phase 8
create_issue "Phase 8: Image Analysis (Gemini Vision)" \
"## 🎯 Goal
Enable image uploads in chat with Gemini Vision analysis for extracting tasks, dates, and lists.

## 📋 Tasks
- [ ] Implement image upload in ChatInput
- [ ] Show image preview before sending
- [ ] Call Gemini Vision API for analysis
- [ ] Parse extracted tasks/events/lists
- [ ] Show action cards for extracted items
- [ ] "Add as Reminder" / "Add to List" buttons
- [ ] Store images in Supabase Storage

## 🔗 Files
- \`src/lib/gemini.js\` (\`callGeminiVision\`)
- \`src/pages/ChatPage.jsx\`
- \`src/store/useChatStore.js\` (\`processImage\`)

## ✅ Done when
- [ ] Image uploads and displays in chat
- [ ] AI extracts tasks from images
- [ ] Extracted items can be saved as reminders/lists" \
"phase-8"

# Phase 9
create_issue "Phase 9: Long-Term Memory + pgvector" \
"## 🎯 Goal
Implement semantic memory storage and retrieval using Gemini embeddings + Supabase pgvector.

## 📋 Tasks
- [ ] Implement \`generateEmbedding\` function
- [ ] Implement \`saveMemory\` (auto-embed on save)
- [ ] Implement \`searchMemories\` (vector similarity search)
- [ ] Integrate memory retrieval into chat pipeline
- [ ] Add memory context to Gemini system prompt
- [ ] Test search relevance

## 🔗 Files
- \`src/lib/vectorSearch.js\`
- \`src/lib/gemini.js\` (\`generateEmbedding\`)
- \`src/store/useChatStore.js\` (memory retrieval)

## ✅ Done when
- [ ] Messages auto-save to memories with embeddings
- [ ] Chat responses reference relevant past memories
- [ ] "What did I say about X?" returns relevant results" \
"phase-9"

# Phase 10
create_issue "Phase 10: Google Calendar Integration" \
"## 🎯 Goal
Connect Google Calendar for viewing events and creating them from chat.

## 📋 Tasks
- [ ] Build CalendarView with react-big-calendar
- [ ] Implement token refresh logic
- [ ] Fetch and display calendar events
- [ ] Build EventModal for viewing/creating events
- [ ] Implement month/week/day/agenda views
- [ ] Add "No calendar connected" state
- [ ] Test create event from chat intent

## 🔗 Files
- \`src/pages/CalendarPage.jsx\`
- \`src/lib/googleCalendar.js\`

## ✅ Done when
- [ ] Calendar shows Google Calendar events
- [ ] Can navigate between months
- [ ] Click event shows details
- [ ] Chat can create calendar events" \
"phase-10"

# Phase 11
create_issue "Phase 11: Memory Trunk + Semantic Search" \
"## 🎯 Goal
Build the file vault with drag-drop upload, AI analysis, and semantic search.

## 📋 Tasks
- [ ] Build FileUploader with drag-and-drop zone
- [ ] Build FileCard with thumbnail/preview
- [ ] Implement AI analysis on upload (Gemini Vision)
- [ ] Implement semantic search bar
- [ ] Build SemanticSearchBar component
- [ ] Add filter tabs (All/Images/PDFs/Documents)
- [ ] Implement file download and delete

## 🔗 Files
- \`src/pages/MemoryTrunkPage.jsx\`
- \`src/store/useMemoryStore.js\`

## ✅ Done when
- [ ] Files upload to Supabase Storage
- [ ] AI generates summary + tags on upload
- [ ] Semantic search returns relevant results
- [ ] File grid shows thumbnails and metadata" \
"phase-11"

# Phase 12
create_issue "Phase 12: Push Notifications + Cron Jobs" \
"## 🎯 Goal
Implement Web Push notifications and Supabase Edge Functions for reminder delivery.

## 📋 Tasks
- [ ] Write service-worker.js (PWA + push handler)
- [ ] Generate VAPID keys
- [ ] Build \`subscribeToPush\` helper
- [ ] Save push subscription to profiles
- [ ] Create Supabase Edge Function: send-reminders
- [ ] Set up pg_cron for every-minute check
- [ ] Handle recurrence (create next occurrence)
- [ ] Test push notification delivery

## 🔗 Files
- \`public/service-worker.js\`
- \`src/lib/webPush.js\`
- \`src/hooks/useNotifications.js\`

## ✅ Done when
- [ ] Push permission flow works
- [ ] Reminders trigger push notifications
- [ ] Recurring reminders create next occurrence" \
"phase-12"

# Phase 13
create_issue "Phase 13: Daily Briefing" \
"## 🎯 Goal
Generate and deliver daily AI-generated morning briefings.

## 📋 Tasks
- [ ] Create daily-briefing Supabase Edge Function
- [ ] Aggregate today's events + reminders + lists
- [ ] Generate briefing with Gemini
- [ ] Save to \`daily_briefings\` table
- [ ] Deliver via push notification
- [ ] Schedule with pg_cron at user's briefing_time
- [ ] Display briefing on Dashboard

## 🔗 Files
- Supabase Edge Function: \`daily-briefing\`
- \`src/pages/DashboardPage.jsx\` (briefing widget)

## ✅ Done when
- [ ] Briefing generates at scheduled time
- [ ] Dashboard shows today's briefing
- [ ] Push notification delivers briefing content" \
"phase-13"

# Phase 14
create_issue "Phase 14: Gmail Integration + Email Page" \
"## 🎯 Goal
Connect Gmail for reading emails, AI classification, and drafting replies.

## 📋 Tasks
- [ ] Build EmailList inbox component
- [ ] Build EmailViewer for full email display
- [ ] Build DraftComposer with AI draft generation
- [ ] Implement AI email classification
- [ ] Implement send/save draft via Gmail API
- [ ] Add "No Gmail connected" state
- [ ] Mark emails as read on open

## 🔗 Files
- \`src/pages/EmailPage.jsx\`
- \`src/lib/gmailClient.js\`

## ✅ Done when
- [ ] Inbox loads with email list
- [ ] Emails classified by AI
- [ ] Can draft replies with AI
- [ ] Can send emails" \
"phase-14"

# Phase 15
create_issue "Phase 15: Settings Page" \
"## 🎯 Goal
Build the settings page with profile editing, notification preferences, integration management, and data controls.

## 📋 Tasks
- [ ] Build settings sidebar with 5 sections
- [ ] Profile section (name, email, timezone)
- [ ] Notifications section (push toggle, briefing time)
- [ ] Integrations section (connect/disconnect Google services)
- [ ] AI Memory section (count, clear memories)
- [ ] Data & Privacy (export, delete all, logout)

## 🔗 Files
- \`src/pages/SettingsPage.jsx\`
- \`src/store/useSettingsStore.js\`

## ✅ Done when
- [ ] Profile changes save
- [ ] Can connect/disconnect integrations
- [ ] Can export all data as JSON
- [ ] Can delete all data with confirmation" \
"phase-15"

# Phase 16
create_issue "Phase 16: Landing Page + PWA Manifest" \
"## 🎯 Goal
Build the marketing landing page and configure PWA manifest for installability.

## 📋 Tasks
- [ ] Build LandingPage with hero, pain points, features, CTA
- [ ] Write \`manifest.json\` for PWA
- [ ] Create app icons (192px, 512px)
- [ ] Add meta tags for mobile
- [ ] Test PWA install flow
- [ ] Add Apple-specific meta tags

## 🔗 Files
- \`src/pages/LandingPage.jsx\`
- \`public/manifest.json\`
- \`index.html\`

## ✅ Done when
- [ ] Landing page looks polished
- [ ] PWA installs on mobile
- [ ] All meta tags present" \
"phase-16"

# Phase 17
create_issue "Phase 17: Polish, Error Handling & Empty States" \
"## 🎯 Goal
Final polish pass: error boundaries, loading skeletons, empty states, toast notifications, and edge case handling.

## 📋 Tasks
- [ ] Add error boundaries to all routes
- [ ] Add loading skeletons to all list views
- [ ] Add empty states with helpful CTAs to all pages
- [ ] Add toast notifications for all CRUD actions
- [ ] Handle API errors gracefully (401, 429, 500)
- [ ] Add rate limiting awareness
- [ ] Test all edge cases (empty data, long text, special chars)
- [ ] Final responsive design pass
- [ ] Lighthouse audit (aim for 90+ PWA score)

## 🔗 Files
- All \`src/components/shared/\`
- All \`src/pages/\`

## ✅ Done when
- [ ] No unhandled errors in console
- [ ] Every page has loading/empty/error states
- [ ] All actions show toast confirmations
- [ ] App scores 90+ on Lighthouse" \
"phase-17"

echo ""
echo "🎉 All 17 issues created!"
echo "📋 View them at: https://github.com/${REPO}/issues"
echo ""

# Cleanup
rm -f /tmp/git-creds
git config credential.helper ""
