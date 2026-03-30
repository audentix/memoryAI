-- ============================================
-- MemorAI — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLES
-- ============================================

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  briefing_time TIME DEFAULT '08:00:00',
  briefing_enabled BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  recurrence TEXT DEFAULT 'none',
  recurrence_rule TEXT,
  status TEXT DEFAULT 'pending',
  snooze_until TIMESTAMPTZ,
  friend_email TEXT,
  source TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lists
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📝',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- List items
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Long-term memories (with vector embeddings)
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  embedding vector(768),
  source TEXT DEFAULT 'chat',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[],
  ai_summary TEXT,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  intent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Google Calendar connections
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  provider TEXT DEFAULT 'google',
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  calendar_id TEXT DEFAULT 'primary',
  connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email connections
CREATE TABLE email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  provider TEXT DEFAULT 'gmail',
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  email_address TEXT,
  connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Friend reminders
CREATE TABLE friend_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT NOT NULL,
  message TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily briefings log
CREATE TABLE daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  delivered_via TEXT[],
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES — each user can only access their own data
-- ============================================

CREATE POLICY "profiles_owner" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reminders_owner" ON reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "lists_owner" ON lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "memories_owner" ON memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "files_owner" ON files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "chat_owner" ON chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cal_conn_owner" ON calendar_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "email_conn_owner" ON email_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "friend_rem_owner" ON friend_reminders FOR ALL USING (auth.uid() = sender_id);
CREATE POLICY "briefings_owner" ON daily_briefings FOR ALL USING (auth.uid() = user_id);

-- List items: access via list ownership
CREATE POLICY "list_items_owner" ON list_items FOR ALL USING (
  list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())
);

-- ============================================
-- VECTOR SEARCH FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(768),
  match_user_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, content TEXT, type TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, content, type, 1 - (embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE user_id = match_user_id AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================
-- INDEXES for performance
-- ============================================

CREATE INDEX idx_reminders_user_remind ON reminders(user_id, remind_at) WHERE status = 'pending';
CREATE INDEX idx_lists_user ON lists(user_id);
CREATE INDEX idx_list_items_list ON list_items(list_id, position);
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_files_user ON files(user_id);
CREATE INDEX idx_chat_user_created ON chat_messages(user_id, created_at);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- STORAGE BUCKET (run in Supabase dashboard or via CLI)
-- ============================================

-- INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', true);

-- CREATE POLICY "memories_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "memories_read" ON storage.objects FOR SELECT USING (bucket_id = 'memories');
-- CREATE POLICY "memories_delete" ON storage.objects FOR DELETE USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
