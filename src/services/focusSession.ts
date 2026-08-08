import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useFocusSessionStore } from '@/stores';
import { APP_CONFIG, FEATURE_FLAGS } from '@/config/environment';
import type { FocusSession, FocusMode } from '@/types';
import { calculateSessionXP } from './xp';

class FocusSessionService {
  private sessionId: string | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private offlineLockKey = 'focusvault_offline_lock';

  async startSession(
    mode: FocusMode,
    duration: number,
    hardcore: boolean = false
  ): Promise<FocusSession> {
    const { startSession: setStoreSession, setLocked } = useFocusSessionStore.getState();
    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (!userId) throw new Error('User not authenticated');

    if (mode !== 'shallow' && !FEATURE_FLAGS.ENABLE_HARDCORE_MODE) {
      throw new Error('Deep focus mode not available');
    }

    if (duration < APP_CONFIG.minimumSessionDuration || 
        duration > APP_CONFIG.maximumSessionDuration) {
      throw new Error('Invalid session duration');
    }

    setStoreSession(mode, duration, hardcore);
    setLocked(true);

    const sessionData = {
      user_id: userId,
      duration_minutes: duration,
      started_at: new Date().toISOString(),
      ended_at: null,
      completed: false,
      hardcore,
      mode,
      xp_earned: 0,
      blocked_apps: [],
      unlock_attempts: 0,
      interrupted: false,
    };

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw new Error(error.message);

    this.sessionId = data.id;
    await this.persistOfflineLock(data.id, mode, duration, hardcore);
    this.startTimer(duration);

    return data;
  }

  private async persistOfflineLock(
    sessionId: string,
    mode: FocusMode,
    duration: number,
    hardcore: boolean
  ): Promise<void> {
    const lockData = {
      sessionId,
      mode,
      duration,
      hardcore,
      startedAt: new Date().toISOString(),
      endTime: new Date(Date.now() + duration * 60 * 1000).toISOString(),
    };
    
    await SecureStore.setItemAsync(
      this.offlineLockKey,
      JSON.stringify(lockData)
    );
  }

  private startTimer(durationMinutes: number): void {
    const { updateRemainingTime } = useFocusSessionStore.getState();
    let remainingSeconds = durationMinutes * 60;

    this.timerInterval = setInterval(() => {
      remainingSeconds--;
      updateRemainingTime(remainingSeconds);

      if (remainingSeconds <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  async completeSession(): Promise<{ xpEarned: number; level: number }> {
    const store = useFocusSessionStore.getState();
    const { sessionState } = store;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const completedAt = new Date();
    const durationMinutes = Math.floor(
      (completedAt.getTime() - new Date(sessionState.startTime!).getTime()) / 60000
    );

    const xpEarned = calculateSessionXP(
      durationMinutes,
      sessionState.mode,
      true,
      sessionState.hardcore
    );

    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        ended_at: completedAt.toISOString(),
        completed: true,
        xp_earned: xpEarned,
        end_reason: 'completed',
      })
      .eq('id', this.sessionId)
      .select()
      .single();

    if (error) console.error('Failed to complete session:', error.message);

    await SecureStore.deleteItemAsync(this.offlineLockKey);
    store.endSession();
    this.sessionId = null;

    return { xpEarned, level: data?.user?.level || 1 };
  }

  async unlockEarly(delayHours?: number): Promise<boolean> {
    const store = useFocusSessionStore.getState();
    const { sessionState } = store;

    if (!sessionState.isLocked) return true;

    if (sessionState.hardcore && sessionState.mode === 'hardcore') {
      if (!delayHours || delayHours < APP_CONFIG.hardcoreUnlockDelay) {
        return false;
      }
    }

    await supabase.from('unlock_attempts').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      session_id: this.sessionId,
      method: delayHours ? 'timer' : 'emergency',
      success: true,
      delay_hours: delayHours,
    });

    store.setLocked(false);
    return true;
  }

  async recordUnlockAttempt(method: 'qr' | 'emergency'): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    await supabase.from('unlock_attempts').insert({
      user_id: userId,
      session_id: this.sessionId,
      method,
      success: false,
    });

    await supabase.rpc('increment_unlock_attempts', {
      session_id: this.sessionId,
    });
  }

  async checkAndRestoreOfflineSession(): Promise<boolean> {
    try {
      const lockDataStr = await SecureStore.getItemAsync(this.offlineLockKey);
      if (!lockDataStr) return false;

      const lockData = JSON.parse(lockDataStr);
      const endTime = new Date(lockData.endTime);

      if (endTime > new Date()) {
        const remainingMs = endTime.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        useFocusSessionStore.getState().setSessionState({
          isActive: true,
          sessionId: lockData.sessionId,
          mode: lockData.mode as FocusMode,
          startTime: lockData.startedAt,
          endTime: lockData.endTime,
          duration: lockData.duration,
          hardcore: lockData.hardcore,
          isLocked: true,
        });

        this.sessionId = lockData.sessionId;
        this.startTimer(remainingMinutes);
        return true;
      } else {
        await SecureStore.deleteItemAsync(this.offlineLockKey);
        return false;
      }
    } catch {
      return false;
    }
  }

  cancelSession(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.sessionId) {
      supabase
        .from('focus_sessions')
        .update({
          ended_at: new Date().toISOString(),
          completed: false,
          interrupted: true,
          end_reason: 'interrupted',
        })
        .eq('id', this.sessionId)
        .then();
    }

    SecureStore.deleteItemAsync(this.offlineLockKey);
    useFocusSessionStore.getState().reset();
    this.sessionId = null;
  }
}

export const focusSessionService = new FocusSessionService();
