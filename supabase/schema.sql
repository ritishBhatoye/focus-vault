-- =====================================================
-- FOCUSVAULT DATABASE SCHEMA
-- Production-Ready Supabase Database for 100k+ Users
-- =====================================================

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (
        subscription_tier IN ('free', 'pro', 'enterprise')
    ),
    subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (
        subscription_status IN ('active', 'cancelled', 'expired', 'trial')
    ),
    xp_total INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    daily_sessions_used INTEGER NOT NULL DEFAULT 0,
    daily_sessions_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_session_at TIMESTAMPTZ,
    
    CONSTRAINT email_valid CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT level_positive CHECK (level >= 1),
    CONSTRAINT xp_non_negative CHECK (xp_total >= 0),
    CONSTRAINT streak_non_negative CHECK (current_streak >= 0 AND longest_streak >= 0)
);

-- Indexes for users table
CREATE INDEX idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_subscription ON public.users(subscription_tier, subscription_status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- =====================================================
-- FOCUS SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    hardcore BOOLEAN NOT NULL DEFAULT FALSE,
    mode TEXT NOT NULL DEFAULT 'shallow' CHECK (
        mode IN ('shallow', 'deep', 'hardcore')
    ),
    xp_earned INTEGER NOT NULL DEFAULT 0,
    blocked_apps TEXT[] NOT NULL DEFAULT '{}',
    unlock_attempts INTEGER NOT NULL DEFAULT 0,
    interrupted BOOLEAN NOT NULL DEFAULT FALSE,
    attention_score INTEGER,
    end_reason TEXT CHECK (
        end_reason IN ('completed', 'unlocked', 'interrupted', 'expired')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT duration_valid CHECK (
        duration_minutes >= 5 AND duration_minutes <= 480
    ),
    CONSTRAINT xp_valid CHECK (xp_earned >= 0)
);

-- Indexes for focus sessions
CREATE INDEX idx_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX idx_sessions_started_at ON public.focus_sessions(started_at DESC);
CREATE INDEX idx_sessions_completed ON public.focus_sessions(user_id, completed);
CREATE INDEX idx_sessions_mode ON public.focus_sessions(mode);
CREATE INDEX idx_sessions_user_completed ON public.focus_sessions(
    user_id, started_at, completed
) WHERE completed = TRUE;

-- =====================================================
-- APP BLOCKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.app_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bundle_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('social', 'entertainment', 'games', 'news', 'shopping', 'productivity')
    ),
    is_blocked BOOLEAN NOT NULL DEFAULT TRUE,
    daily_limit_minutes INTEGER,
    used_today_minutes INTEGER NOT NULL DEFAULT 0,
    open_count_today INTEGER NOT NULL DEFAULT 0,
    video_count_today INTEGER NOT NULL DEFAULT 0,
    daily_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT app_block_unique UNIQUE (user_id, bundle_id),
    CONSTRAINT daily_limit_check CHECK (
        daily_limit_minutes IS NULL OR daily_limit_minutes > 0
    ),
    CONSTRAINT used_minutes_check CHECK (used_today_minutes >= 0),
    CONSTRAINT open_count_check CHECK (open_count_today >= 0),
    CONSTRAINT video_count_check CHECK (video_count_today >= 0)
);

-- Indexes for app blocks
CREATE INDEX idx_app_blocks_user ON public.app_blocks(user_id);
CREATE INDEX idx_app_blocks_bundle ON public.app_blocks(bundle_id);
CREATE INDEX idx_app_blocks_category ON public.app_blocks(category);

-- =====================================================
-- UNLOCK ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.unlock_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method TEXT NOT NULL CHECK (
        method IN ('qr', 'timer', 'emergency')
    ),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    delay_hours INTEGER,
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT delay_hours_check CHECK (
        delay_hours IS NULL OR (delay_hours >= 1 AND delay_hours <= 168)
    )
);

-- Indexes for unlock attempts
CREATE INDEX idx_unlock_user ON public.unlock_attempts(user_id);
CREATE INDEX idx_unlock_session ON public.unlock_attempts(session_id);
CREATE INDEX idx_unlock_attempted_at ON public.unlock_attempts(attempted_at DESC);

-- =====================================================
-- BEHAVIORAL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.behavioral_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
    trigger_type TEXT NOT NULL CHECK (
        trigger_type IN ('app_open', 'notification', 'urge_check', 'boredom', 'habit')
    ),
    trigger_context TEXT,
    impulse_strength INTEGER CHECK (
        impulse_strength >= 1 AND impulse_strength <= 10
    ),
    reflection_prompt TEXT,
    reflection_response TEXT,
    resisted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for behavioral logs
CREATE INDEX idx_behavioral_user ON public.behavioral_logs(user_id);
CREATE INDEX idx_behavioral_session ON public.behavioral_logs(session_id);
CREATE INDEX idx_behavioral_type ON public.behavioral_logs(trigger_type);
CREATE INDEX idx_behavioral_created ON public.behavioral_logs(created_at DESC);
CREATE INDEX idx_behavioral_resisted ON public.behavioral_logs(user_id, resisted)
    WHERE resisted = TRUE;

-- =====================================================
-- WEEKLY INSIGHTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.weekly_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_focus_time INTEGER NOT NULL DEFAULT 0,
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    sessions_abandoned INTEGER NOT NULL DEFAULT 0,
    avg_session_duration NUMERIC(6,2),
    unlock_attempts INTEGER NOT NULL DEFAULT 0,
    attention_score INTEGER,
    top_triggers TEXT[] NOT NULL DEFAULT '{}',
    behavioral_patterns TEXT[] NOT NULL DEFAULT '{}',
    xp_earned INTEGER NOT NULL DEFAULT 0,
    achievements_unlocked TEXT[] NOT NULL DEFAULT '{}',
    improvement_notes TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT weekly_insight_unique UNIQUE (user_id, week_start),
    CONSTRAINT week_dates_valid CHECK (week_end > week_start),
    CONSTRAINT focus_time_check CHECK (total_focus_time >= 0),
    CONSTRAINT sessions_check CHECK (
        sessions_completed >= 0 AND sessions_abandoned >= 0
    )
);

-- Indexes for weekly insights
CREATE INDEX idx_weekly_user ON public.weekly_insights(user_id);
CREATE INDEX idx_weekly_week ON public.weekly_insights(week_start DESC);

-- =====================================================
-- XP PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.xp_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 1000,
    daily_xp INTEGER NOT NULL DEFAULT 0,
    weekly_xp INTEGER NOT NULL DEFAULT 0,
    monthly_xp INTEGER NOT NULL DEFAULT 0,
    daily_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weekly_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    monthly_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for xp progress
CREATE INDEX idx_xp_user ON public.xp_progress(user_id);
CREATE INDEX idx_xp_level ON public.xp_progress(level DESC);

-- =====================================================
-- ACHIEVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ,
    progress INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT achievement_unique UNIQUE (user_id, achievement_id)
);

-- Indexes for achievements
CREATE INDEX idx_achievements_user ON public.achievements(user_id);
CREATE INDEX idx_achievements_completed ON public.achievements(user_id, completed)
    WHERE completed = TRUE;

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (
        tier IN ('free', 'pro', 'enterprise')
    ),
    status TEXT NOT NULL DEFAULT 'trial' CHECK (
        status IN ('active', 'cancelled', 'expired', 'trial')
    ),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_customer_id);

-- =====================================================
-- FEATURE FLAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (
        rollout_percentage >= 0 AND rollout_percentage <= 100
    ),
    user_ids TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feature flags
CREATE INDEX idx_feature_flags_name ON public.feature_flags(name);

-- =====================================================
-- QR CODES TABLE (for unlock system)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    mode TEXT NOT NULL DEFAULT 'deep' CHECK (
        mode IN ('shallow', 'deep', 'hardcore')
    ),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for qr codes
CREATE INDEX idx_qr_codes_user ON public.qr_codes(user_id);
CREATE INDEX idx_qr_codes_code ON public.qr_codes(code) WHERE is_active = TRUE;
CREATE INDEX idx_qr_codes_session ON public.qr_codes(session_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS RLS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role full access to users"
    ON public.users FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- FOCUS SESSIONS RLS POLICIES
-- =====================================================

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
    ON public.focus_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
    ON public.focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
    ON public.focus_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to sessions"
    ON public.focus_sessions FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- APP BLOCKS RLS POLICIES
-- =====================================================

-- Users can manage their own app blocks
CREATE POLICY "Users can manage own app blocks"
    ON public.app_blocks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to app blocks"
    ON public.app_blocks FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- UNLOCK ATTEMPTS RLS POLICIES
-- =====================================================

-- Users can read their own unlock attempts
CREATE POLICY "Users can read own unlock attempts"
    ON public.unlock_attempts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own unlock attempts
CREATE POLICY "Users can insert own unlock attempts"
    ON public.unlock_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to unlock attempts"
    ON public.unlock_attempts FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- BEHAVIORAL LOGS RLS POLICIES
-- =====================================================

-- Users can manage their own behavioral logs
CREATE POLICY "Users can manage own behavioral logs"
    ON public.behavioral_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to behavioral logs"
    ON public.behavioral_logs FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- WEEKLY INSIGHTS RLS POLICIES
-- =====================================================

-- Users can read their own insights
CREATE POLICY "Users can read own insights"
    ON public.weekly_insights FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own insights
CREATE POLICY "Users can insert own insights"
    ON public.weekly_insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own insights
CREATE POLICY "Users can update own insights"
    ON public.weekly_insights FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to insights"
    ON public.weekly_insights FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- XP PROGRESS RLS POLICIES
-- =====================================================

-- Users can read their own XP progress
CREATE POLICY "Users can read own XP progress"
    ON public.xp_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own XP progress
CREATE POLICY "Users can update own XP progress"
    ON public.xp_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to XP"
    ON public.xp_progress FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- ACHIEVEMENTS RLS POLICIES
-- =====================================================

-- Users can manage their own achievements
CREATE POLICY "Users can manage own achievements"
    ON public.achievements FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to achievements"
    ON public.achievements FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- SUBSCRIPTIONS RLS POLICIES
-- =====================================================

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- FEATURE FLAGS RLS POLICIES
-- =====================================================

-- Users can read feature flags (public for feature detection)
CREATE POLICY "Users can read feature flags"
    ON public.feature_flags FOR SELECT
    USING (enabled = true OR rollout_percentage = 100);

-- Service role can manage feature flags
CREATE POLICY "Service role manage feature flags"
    ON public.feature_flags FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- QR CODES RLS POLICIES
-- =====================================================

-- Users can manage their own QR codes
CREATE POLICY "Users can manage own QR codes"
    ON public.qr_codes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access to QR codes"
    ON public.qr_codes FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to calculate XP for session completion
CREATE OR REPLACE FUNCTION calculate_session_xp(
    p_duration_minutes INTEGER,
    p_mode TEXT,
    p_completed BOOLEAN,
    p_hardcore BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
    v_base_xp INTEGER;
    v_mode_multiplier NUMERIC(3,2);
    v_hardcore_multiplier NUMERIC(3,2);
BEGIN
    IF NOT p_completed THEN
        RETURN 0;
    END IF;
    
    v_base_xp := p_duration_minutes * 10;
    
    v_mode_multiplier := CASE
        WHEN p_mode = 'shallow' THEN 1.0
        WHEN p_mode = 'deep' THEN 1.5
        WHEN p_mode = 'hardcore' THEN 2.0
        ELSE 1.0
    END;
    
    v_hardcore_multiplier := CASE
        WHEN p_hardcore THEN 1.5
        ELSE 1.0
    END;
    
    RETURN ROUND(v_base_xp * v_mode_multiplier * v_hardcore_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(p_xp INTEGER) RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(1 + SQRT(p_xp / 100.0))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION calculate_xp_for_next_level(p_level INTEGER) RETURNS INTEGER AS $$
BEGIN
    RETURN POWER(p_level, 2) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate secure unlock code
CREATE OR REPLACE FUNCTION generate_unlock_code() RETURNS TEXT AS $$
BEGIN
    return encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate attention score
CREATE OR REPLACE FUNCTION calculate_attention_score(
    p_sessions_completed INTEGER,
    p_sessions_abandoned INTEGER,
    p_unlock_attempts INTEGER,
    p_avg_session_duration NUMERIC
) RETURNS INTEGER AS $$
DECLARE
    v_completion_rate NUMERIC;
    v_attempts_per_session NUMERIC;
    v_duration_factor NUMERIC;
    v_score INTEGER;
BEGIN
    v_completion_rate := CASE
        WHEN (p_sessions_completed + p_sessions_abandoned) > 0
        THEN p_sessions_completed::NUMERIC / (p_sessions_completed + p_sessions_abandoned)
        ELSE 0
    END;
    
    v_att CASE
        WHENempts_per_session := p_sessions_completed > 0
        THEN p_unlock_attempts::NUMERIC / p_sessions_completed
        ELSE 0
    END;
    
    v_duration_factor := LEAST(p_avg_session_duration / 60, 1.0);
    
    v_score := ROUND(
        (v_completion_rate * 0.4 + (1 - LEAST(v_attempts_per_session / 5, 1)) * 0.3 + v_duration_factor * 0.3)
        * 100
    );
    
    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- DATABASE TRIGGERS
-- =====================================================

-- Trigger to update user XP and level on session insert
CREATE OR REPLACE FUNCTION update_user_xp_on_session()
RETURNS TRIGGER AS $$
DECLARE
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_xp_to_next INTEGER;
BEGIN
    IF NEW.completed AND NEW.xp_earned > 0 THEN
        UPDATE public.users
        SET 
            xp_total = xp_total + NEW.xp_earned,
            level = calculate_level(xp_total + NEW.xp_earned),
            last_session_at = NEW.ended_at,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        UPDATE public.xp_progress
        SET 
            total_xp = total_xp + NEW.xp_earned,
            level = calculate_level(total_xp + NEW.xp_earned),
            xp_to_next_level = calculate_xp_for_next_level(calculate_level(total_xp + NEW.xp_earned)),
            daily_xp = daily_xp + NEW.xp_earned,
            weekly_xp = weekly_xp + NEW.xp_earned,
            monthly_xp = monthly_xp + NEW.xp_earned,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_xp
    AFTER INSERT ON public.focus_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_xp_on_session();

-- Trigger to reset daily sessions counter at midnight
CREATE OR REPLACE FUNCTION reset_daily_sessions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.daily_sessions_reset_at < CURRENT_DATE THEN
        NEW.daily_sessions_used := 0;
        NEW.daily_sessions_reset_at := CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_daily_sessions
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION reset_daily_sessions();

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- View for user analytics summary
CREATE OR REPLACE VIEW public.user_analytics_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.xp_total,
    u.level,
    u.current_streak,
    u.longest_streak,
    u.subscription_tier,
    COUNT(fs.id) FILTER (WHERE fs.started_at >= NOW() - INTERVAL '7 days') as weekly_sessions,
    SUM(fs.duration_minutes) FILTER (WHERE fs.started_at >= NOW() - INTERVAL '7 days') as weekly_focus_time,
    COUNT(fs.id) FILTER (WHERE fs.completed = true) as total_completed_sessions,
    AVG(fs.xp_earned) FILTER (WHERE fs.completed = true) as avg_xp_per_session
FROM public.users u
LEFT JOIN public.focus_sessions fs ON u.id = fs.user_id
GROUP BY u.id, u.email, u.xp_total, u.level, u.current_streak, u.longest_streak, u.subscription_tier;

-- View for behavioral patterns
CREATE OR REPLACE VIEW public.behavioral_patterns_view AS
SELECT 
    user_id,
    trigger_type,
    COUNT(*) as trigger_count,
    AVG(impulse_strength) as avg_impulse_strength,
    SUM(CASE WHEN resisted THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) as resistance_rate
FROM public.behavioral_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, trigger_type;

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Analyze tables for query optimization
ANALYZE public.users;
ANALYZE public.focus_sessions;
ANALYZE public.app_blocks;
ANALYZE public.unlock_attempts;
ANALYZE public.behavioral_logs;
ANALYZE public.weekly_insights;
ANALYZE public.xp_progress;
ANALYZE public.achievements;
ANALYZE public.subscriptions;
ANALYZE public.feature_flags;
ANALYZE public.qr_codes;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default feature flags
INSERT INTO public.feature_flags (name, enabled, rollout_percentage) VALUES
    ('enable_hardcore_mode', true, 100),
    ('enable_qr_unlock', true, 100),
    ('enable_behavioral_insights', true, 100),
    ('enable_micro_blocking', false, 0),
    ('enable_advanced_analytics', false, 0),
    ('enable_xp_gamification', true, 100),
    ('enable_achievements', true, 100),
    ('enable_subscription', true, 100)
ON CONFLICT (name) DO NOTHING;

-- Insert achievement definitions (stored in code, referenced by ID)
-- This is a reference table for achievement metadata
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    xp_reward INTEGER NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed achievement definitions
INSERT INTO public.achievement_definitions (id, name, description, icon, category, xp_reward, tier, criteria) VALUES
    ('first_session', 'First Focus', 'Complete your first focus session', '🎯', 'sessions', 50, 'bronze', '{"sessions_completed": 1}'),
    ('streak_3', 'Getting Started', 'Maintain a 3-day streak', '🔥', 'streaks', 100, 'bronze', '{"streak_days": 3}'),
    ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', '💪', 'streaks', 250, 'silver', '{"streak_days": 7}'),
    ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', '👑', 'streaks', 1000, 'gold', '{"streak_days": 30}'),
    ('focus_10h', 'Time Investor', 'Accumulate 10 hours of focus time', '⏰', 'time', 200, 'bronze', '{"total_minutes": 600}'),
    ('focus_50h', 'Focus Champion', 'Accumulate 50 hours of focus time', '🏆', 'time', 500, 'silver', '{"total_minutes": 3000}'),
    ('focus_200h', 'Focus Master', 'Accumulate 200 hours of focus time', '🌟', 'time', 2000, 'gold', '{"total_minutes": 12000}'),
    ('deep_10', 'Deep Diver', 'Complete 10 deep focus sessions', '🌊', 'mode', 300, 'silver', '{"deep_sessions": 10}'),
    ('hardcore_5', 'Iron Will', 'Complete 5 hardcore sessions', '⚡', 'mode', 500, 'gold', '{"hardcore_sessions": 5}'),
    ('level_5', 'Rising Star', 'Reach level 5', '⭐', 'progression', 150, 'bronze', '{"level": 5}'),
    ('level_10', 'Focus Expert', 'Reach level 10', '🎖️', 'progression', 400, 'silver', '{"level": 10}'),
    ('perfect_week', 'Perfect Week', 'Complete all sessions for a week', '💎', 'streaks', 750, 'gold', '{"perfect_week": 1}')
ON CONFLICT (id) DO NOTHING;
