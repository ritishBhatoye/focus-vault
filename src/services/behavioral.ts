import { supabase } from '@/lib/supabase';
import type { TriggerType, BehavioralLog, WeeklyInsight } from '@/types';

const TRIGGER_PROMPTS: Record<TriggerType, string[]> = {
  app_open: [
    'What triggered this urge?',
    'Is this aligned with your current goal?',
    'What will you gain vs lose?',
  ],
  notification: [
    'Can this wait 25 minutes?',
    'Who needs you right now?',
    'Is this urgent or just habit?',
  ],
  urge_check: [
    'What are you hoping to find?',
    'Is your session still active?',
    'Take three deep breaths first.',
  ],
  boredom: [
    'Boredom is where focus begins.',
    'What project could you work on?',
    'Embrace the discomfort.',
  ],
  habit: [
    'This is a habit loop. Break it.',
    'Your old self is calling. Ignore.',
    'New identity = new patterns.',
  ],
};

class BehavioralIntelligenceService {
  async logTrigger(
    triggerType: TriggerType,
    context: string,
    impulseStrength: number = 5,
    sessionId?: string
  ): Promise<BehavioralLog> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) throw new Error('User not authenticated');

    const prompt = this.getReflectionPrompt(triggerType);

    const { data, error } = await supabase
      .from('behavioral_logs')
      .insert({
        user_id: userId,
        session_id: sessionId,
        trigger_type: triggerType,
        trigger_context: context,
        impulse_strength: impulseStrength,
        reflection_prompt: prompt,
        resisted: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  async recordReflection(
    logId: string,
    response: string,
    resisted: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('behavioral_logs')
      .update({
        reflection_response: response,
        resisted,
      })
      .eq('id', logId);

    if (error) throw new Error(error.message);
  }

  getReflectionPrompt(triggerType: TriggerType): string {
    const prompts = TRIGGER_PROMPTS[triggerType];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  async generateWeeklyInsight(userId: string): Promise<WeeklyInsight> {
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd();

    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', weekStart.toISOString())
      .lte('started_at', weekEnd.toISOString());

    const { data: logs } = await supabase
      .from('behavioral_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());

    const completedSessions = sessions?.filter(s => s.completed) || [];
    const abandonedSessions = sessions?.filter(s => !s.completed && s.interrupted) || [];
    const totalFocusTime = completedSessions.reduce((acc, s) => acc + s.duration_minutes, 0);
    const avgSessionDuration = completedSessions.length > 0 
      ? totalFocusTime / completedSessions.length 
      : 0;
    const unlockAttempts = sessions?.reduce((acc, s) => acc + s.unlock_attempts, 0) || 0;

    const triggerCounts: Record<string, number> = {};
    logs?.forEach(log => {
      triggerCounts[log.trigger_type] = (triggerCounts[log.trigger_type] || 0) + 1;
    });
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trigger]) => trigger);

    const resistedCount = logs?.filter(l => l.resisted).length || 0;
    const totalTriggers = logs?.length || 0;
    const resistanceRate = totalTriggers > 0 ? resistedCount / totalTriggers : 0;

    const completionRate = sessions?.length 
      ? completedSessions.length / sessions.length 
      : 0;

    const attentionScore = Math.round(
      completionRate * 40 +
      resistanceRate * 30 +
      Math.min(avgSessionDuration / 60, 1) * 30
    );

    const xpEarned = completedSessions.reduce((acc, s) => acc + s.xp_earned, 0);

    const insight: Omit<WeeklyInsight, 'id' | 'user_id'> = {
      week_start: weekStart.toISOString(),
      week_end: weekEnd.toISOString(),
      total_focus_time: totalFocusTime,
      sessions_completed: completedSessions.length,
      sessions_abandoned: abandonedSessions.length,
      avg_session_duration: avgSessionDuration,
      unlock_attempts: unlockAttempts,
      attention_score: attentionScore,
      top_triggers: topTriggers,
      behavioral_patterns: this.analyzePatterns(completedSessions, logs || []),
      xp_earned: xpEarned,
      achievements_unlocked: [],
      generated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('weekly_insights')
      .upsert({
        user_id: userId,
        ...insight,
      }, {
        onConflict: 'user_id,week_start',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  private analyzePatterns(
    sessions: any[],
    logs: any[]
  ): string[] {
    const patterns: string[] = [];

    const hourCounts: Record<number, number> = {};
    sessions.forEach(s => {
      const hour = new Date(s.started_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0];
    if (peakHour && peakHour[1] >= 3) {
      patterns.push(`Most productive at ${this.formatHour(parseInt(peakHour[0]))}`);
    }

    const avgDuration = sessions.reduce((a, s) => a + s.duration_minutes, 0) / (sessions.length || 1);
    if (avgDuration >= 45) patterns.push('Prefers long sessions');
    else if (avgDuration <= 15) patterns.push('Prefers short bursts');

    const byDay: Record<string, number> = {};
    sessions.forEach(s => {
      const day = new Date(s.started_at).toLocaleDateString('en-US', { weekday: 'short' });
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) patterns.push(`Strongest on ${bestDay[0]}`);

    const resistedLogs = logs.filter(l => l.resisted);
    if (resistedLogs.length >= 5) {
      patterns.push('Strong willpower development');
    }

    return patterns;
  }

  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  private getWeekEnd(): Date {
    const start = this.getWeekStart();
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  private formatHour(hour: number): string {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h} ${suffix}`;
  }

  async getAttentionScore(userId: string): Promise<number> {
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!sessions || sessions.length === 0) return 0;

    const completed = sessions.filter(s => s.completed);
    const completionRate = completed.length / sessions.length;
    
    const avgDuration = completed.reduce((a, s) => a + s.duration_minutes, 0) / (completed.length || 1);
    const durationFactor = Math.min(avgDuration / 60, 1);

    const { data: logs } = await supabase
      .from('behavioral_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const resisted = logs?.filter(l => l.resisted).length || 0;
    const resistanceRate = (logs?.length || 0) > 0 ? resisted / logs!.length : 0;

    return Math.round(completionRate * 40 + resistanceRate * 30 + durationFactor * 30);
  }
}

export const behavioralService = new BehavioralIntelligenceService();
