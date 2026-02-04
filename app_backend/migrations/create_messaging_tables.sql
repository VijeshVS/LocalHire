-- =============================================
-- LocalHire Messaging & Notifications Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. NOTIFICATIONS TABLE
-- Stores in-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('EMPLOYEE', 'EMPLOYER')),
    type VARCHAR(50) NOT NULL, -- 'application_accepted', 'application_rejected', 'application_shortlisted', 'message', 'job_match'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- { job_id, application_id, conversation_id, etc. }
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, user_role, is_read) WHERE is_read = FALSE;

-- 2. CONVERSATIONS TABLE
-- Stores chat conversations between users
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL,
    participant1_role VARCHAR(20) NOT NULL CHECK (participant1_role IN ('EMPLOYEE', 'EMPLOYER')),
    participant2_id UUID NOT NULL,
    participant2_role VARCHAR(20) NOT NULL CHECK (participant2_role IN ('EMPLOYEE', 'EMPLOYER')),
    job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL, -- Optional link to a job
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);

-- 3. MESSAGES TABLE
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('EMPLOYEE', 'EMPLOYER')),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at);

-- =============================================
-- Enable Row Level Security (RLS) - Optional but recommended
-- =============================================

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for notifications (users can only see their own notifications)
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (true);
    
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (true);
    
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (true);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Policies for conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (true);
    
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (true);
    
CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (true);

-- Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (true);
    
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (true);
    
CREATE POLICY "Users can update message read status" ON messages
    FOR UPDATE USING (true);

-- =============================================
-- Done! Your messaging system tables are ready.
-- =============================================
