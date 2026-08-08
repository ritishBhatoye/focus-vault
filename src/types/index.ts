export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  xp_total: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
  last_session_at: string | null;
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  hardcore: boolean;
  mode: FocusMode;
  xp_earned: number;
  blocked_apps: string[];
  unlock_attempts: number;
  interrupted: boolean;
  created_at: string;
}

export type FocusMode = 'shallow' | 'deep' | 'hardcore';

export interface AppBlock {
  id: string;
  user_id: string;
  bundle_id: string;
  app_name: string;
  category: AppCategory;
  is_blocked: boolean;
  daily_limit_minutes: number | null;
  used_today_minutes: number;
  open_count_today: number;
  video_count_today: number;
  created_at: string;
  updated_at: string;
}

export type AppCategory = 
  | 'social'
  | 'entertainment'
  | 'games'
  | 'news'
  | 'shopping'
  | 'productivity';

export interface UnlockAttempt {
  id: string;
  user_id: string;
  session_id: string;
  attempted_at: string;
  method: UnlockMethod;
  success: boolean;
  delay_hours: number | null;
  created_at: string;
}

export type UnlockMethod = 'qr' | 'timer' | 'emergency';

export interface BehavioralLog {
  id: string;
  user_id: string;
  session_id: string | null;
  trigger_type: TriggerType;
  trigger_context: string;
  impulse_strength: number;
  reflection_prompt: string | null;
  reflection_response: string | null;
  resisted: boolean;
  created_at: string;
}

export type TriggerType = 
  | 'app_open'
  | 'notification'
  | 'urge_check'
  | 'boredom'
  | 'habit';

export interface WeeklyInsight {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_focus_time: number;
  sessions_completed: number;
  sessions_abandoned: number;
  avg_session_duration: number;
  unlock_attempts: number;
  attention_score: number;
  top_triggers: string[];
  behavioral_patterns: string[];
  xp_earned: number;
  achievements_unlocked: string[];
  generated_at: string;
}

export interface XPProgress {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  daily_xp: number;
  weekly_xp: number;
  monthly_xp: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  completed: boolean;
  reward_xp: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rollout_percentage: number;
  user_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SessionState {
  isActive: boolean;
  sessionId: string | null;
  mode: FocusMode;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  hardcore: boolean;
  isLocked: boolean;
}

export interface AnalyticsData {
  totalFocusTime: number;
  weeklyFocusTime: number;
  dailyFocusTime: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  currentStreak: number;
  longestStreak: number;
  attentionScore: number;
  xpEarned: number;
  level: number;
  xpToNextLevel: number;
}

export interface UnlockQRCode {
  sessionId: string;
  code: string;
  expiresAt: Date;
  mode: FocusMode;
}
