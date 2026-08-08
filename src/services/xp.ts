import { supabase } from '@/lib/supabase';
import type { FocusMode, Achievement } from '@/types';

const XP_BASE = 10;
const LEVEL_SQUARE_ROOT = 100;

const ACHIEVEMENT_DEFINITIONS = {
  first_session: { xp: 50, name: 'First Focus' },
  streak_3: { xp: 100, name: 'Getting Started' },
  streak_7: { xp: 250, name: 'Week Warrior' },
  streak_30: { xp: 1000, name: 'Monthly Master' },
  focus_10h: { xp: 200, name: 'Time Investor' },
  focus_50h: { xp: 500, name: 'Focus Champion' },
  focus_200h: { xp: 2000, name: 'Focus Master' },
  deep_10: { xp: 300, name: 'Deep Diver' },
  hardcore_5: { xp: 500, name: 'Iron Will' },
  level_5: { xp: 150, name: 'Rising Star' },
  level_10: { xp: 400, name: 'Focus Expert' },
  perfect_week: { xp: 750, name: 'Perfect Week' },
} as const;

export function calculateSessionXP(
  durationMinutes: number,
  mode: FocusMode,
  completed: boolean,
  hardcore: boolean
): number {
  if (!completed) return 0;

  const baseXP = durationMinutes * XP_BASE;
  const modeMultiplier = getModeMultiplier(mode);
  const hardcoreMultiplier = hardcore ? 1.5 : 1.0;

  return Math.round(baseXP * modeMultiplier * hardcoreMultiplier);
}

function getModeMultiplier(mode: FocusMode): number {
  switch (mode) {
    case 'shallow':
      return 1.0;
    case 'deep':
      return 1.5;
    case 'hardcore':
      return 2.0;
    default:
      return 1.0;
  }
}

export function calculateLevel(totalXP: number): number {
  return Math.floor(1 + Math.sqrt(totalXP / LEVEL_SQUARE_ROOT));
}

export function calculateXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * LEVEL_SQUARE_ROOT;
}

export function calculateXPProgress(currentXP: number): {
  level: number;
  currentLevelXP: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  const level = calculateLevel(currentXP);
  const xpForCurrentLevel = Math.pow(level - 1, 2) * LEVEL_SQUARE_ROOT;
  const xpForNextLevel = calculateXPForNextLevel(level);
  const currentLevelXP = currentXP - xpForCurrentLevel;
  const xpToNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (currentLevelXP / xpToNextLevel) * 100;

  return {
    level,
    currentLevelXP,
    xpToNextLevel,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
  };
}

export async function checkAndAwardAchievements(
  userId: string,
  stats: {
    totalSessions: number;
    completedSessions: number;
    totalFocusMinutes: number;
    currentStreak: number;
    deepSessions: number;
    hardcoreSessions: number;
    level: number;
    perfectWeeks: number;
  }
): Promise<Achievement[]> {
  const newAchievements: Achievement[] = [];

  const { data: existingAchievements } = await supabase
    .from('achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const existingIds = new Set(existingAchievements?.map(a => a.achievement_id) || []);

  for (const [id, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
    if (existingIds.has(id)) continue;

    let earned = false;
    let progress = 0;

    switch (id) {
      case 'first_session':
        earned = stats.completedSessions >= 1;
        progress = stats.completedSessions;
        break;
      case 'streak_3':
        earned = stats.currentStreak >= 3;
        progress = stats.currentStreak;
        break;
      case 'streak_7':
        earned = stats.currentStreak >= 7;
        progress = stats.currentStreak;
        break;
      case 'streak_30':
        earned = stats.currentStreak >= 30;
        progress = stats.currentStreak;
        break;
      case 'focus_10h':
        earned = stats.totalFocusMinutes >= 600;
        progress = stats.totalFocusMinutes;
        break;
      case 'focus_50h':
        earned = stats.totalFocusMinutes >= 3000;
        progress = stats.totalFocusMinutes;
        break;
      case 'focus_200h':
        earned = stats.totalFocusMinutes >= 12000;
        progress = stats.totalFocusMinutes;
        break;
      case 'deep_10':
        earned = stats.deepSessions >= 10;
        progress = stats.deepSessions;
        break;
      case 'hardcore_5':
        earned = stats.hardcoreSessions >= 5;
        progress = stats.hardcoreSessions;
        break;
      case 'level_5':
        earned = stats.level >= 5;
        progress = stats.level;
        break;
      case 'level_10':
        earned = stats.level >= 10;
        progress = stats.level;
        break;
      case 'perfect_week':
        earned = stats.perfectWeeks >= 1;
        progress = stats.perfectWeeks;
        break;
    }

    if (earned) {
      const { data, error } = await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_id: id,
          unlocked_at: new Date().toISOString(),
          progress,
          completed: true,
          reward_xp: definition.xp,
        })
        .select()
        .single();

      if (!error && data) {
        newAchievements.push(data);

        await supabase.rpc('add_xp', {
          user_id: userId,
          xp_amount: definition.xp,
        });
      }
    }
  }

  return newAchievements;
}

export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Focus Legend';
  if (level >= 40) return 'Discipline Master';
  if (level >= 30) return 'Attention Architect';
  if (level >= 20) return 'Concentration Champion';
  if (level >= 15) return 'Focus Warrior';
  if (level >= 10) return 'Focus Expert';
  if (level >= 5) return 'Focus Apprentice';
  return 'Novice';
}
