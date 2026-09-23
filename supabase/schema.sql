-- ===================================================================
-- 🌌 VANGUARDZ PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- ===================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- to provision all tables, indexes, and security policies.

-- 1. PILOT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    max_unlocked_checkpoint INT NOT NULL DEFAULT 0,
    high_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_high_score ON public.profiles (high_score DESC NULLS LAST);

-- Enable Row Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Public can read profiles and leaderboards" ON public.profiles;
CREATE POLICY "Public can read profiles and leaderboards"
    ON public.profiles
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can register pilot profiles" ON public.profiles;
CREATE POLICY "Public can register pilot profiles"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update pilot progress" ON public.profiles;
CREATE POLICY "Public can update pilot progress"
    ON public.profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);


-- 2. TRANSMISSION FEEDBACKS TABLE
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT DEFAULT 'anonymous',
    feedback TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedbacks Performance Indexes
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks (created_at DESC);

-- Enable Row Level Security (RLS) on Feedbacks
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Feedbacks RLS Policies
DROP POLICY IF EXISTS "Anyone can submit pilot feedback" ON public.feedbacks;
CREATE POLICY "Anyone can submit pilot feedback"
    ON public.feedbacks
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users or service role can review feedback" ON public.feedbacks;
CREATE POLICY "Authenticated users or service role can review feedback"
    ON public.feedbacks
    FOR SELECT
    USING (auth.role() = 'authenticated');
