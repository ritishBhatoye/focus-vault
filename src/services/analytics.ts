import { supabase } from '@/lib/supabase';
import { useAnalyticsStore } from '@/stores';
import { calculateXPProgress } from './xp';
import type { AnalyticsData } from '@/types';

class AnalyticsService {
  async fetchUserAnalytics(userId: string): Promise<AnalyticsData> {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);

    const totalFocusTime = sessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;

    const { data: weeklySessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('started_at', sevenDaysAgo.toISOString());

    const weeklyFocusTime = weeklySessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;

    const { data: todaySessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', todayStart.toISOString());

    const dailyFocusTime = todaySessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;

    const { data: allTimeSessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId);

    const sessionsCompleted = allTimeSessions?.filter(s => s.completed).length || 0;
    const sessionsAbandoned = allTimeSessions?.filter(s => !s.completed && s.interrupted).length || 0;

    const { data: weeklyLogs } = await supabase
      .from('behavioral_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const resistedCount = weeklyLogs?.filter(l => l.resisted).length || 0;
    const totalTriggers = weeklyLogs?.length || 0;
    const resistanceRate = totalTriggers > 0 ? resistedCount / totalTriggers : 0;
    const completionRate = (weeklySessions?.length || 0) > 0 
      ? weeklySessions!.filter(s => s.completed).length / weeklySessions!.length 
      : 0;
    const avgDuration = (weeklySessions?.length || 0) > 0
      ? weeklySessions!.reduce((a, s) => a + s.duration_minutes, 0) / weeklySessions!.length
      : 0;

    const attentionScore = Math.round(
      completionRate * 40 +
      resistanceRate * 30 +
      Math.min(avgDuration / 60, 1) * 30
    );

    const xpProgress = calculateXPProgress(user.xp_total);

    const analytics: AnalyticsData = {
      totalFocusTime,
      weeklyFocusTime,
      dailyFocusTime,
      sessionsCompleted,
      sessionsAbandoned,
      currentStreak: user.current_streak,
      longestStreak: user.longest_streak,
      attentionScore,
      xpEarned: user.xp_total,
      level: user.level,
      xpToNextLevel: xpProgress.xpToNextLevel,
    };

    useAnalyticsStore.getState().setAnalytics(analytics);

    return analytics;
  }

  calculateTimeSaved(sessionsCompleted: number, avgDuration: number): number {
    const distractionOverhead = 15;
    const recoveryTime = 5;
    return sessionsCompleted * (avgDuration + distractionOverhead + recoveryTime);
  }

  generateHeatmapData(userId: string): { day: string; hour: number; value: number }[] {
    return [];
  }

  getStreakStatus(userId: string): { 
    current: number; 
    longest: number; 
    daysUntilLoss: number;
  } {
    return {
      current: 0,
      longest: 0,
      daysUntilLoss: 1,
    };
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  formatLargeNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }
}

export const analyticsService = new AnalyticsService();
