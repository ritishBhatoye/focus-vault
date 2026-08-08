import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import type { Achievement } from '@/types';

const ACHIEVEMENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  first_session: 'disc-outline',
  streak_3: 'flame-outline',
  streak_7: 'fitness-outline',
  streak_30: 'ribbon-outline',
  focus_10h: 'time-outline',
  focus_50h: 'trophy-outline',
  focus_200h: 'star-outline',
  deep_10: 'water-outline',
  hardcore_5: 'flash-outline',
  level_5: 'sparkles-outline',
  level_10: 'medal-outline',
  perfect_week: 'diamond-outline',
};

const ACHIEVEMENT_COLORS: Record<string, string> = {
  first_session: '#4FDBC8',
  streak_3: '#FFB95F',
  streak_7: '#7C3AED',
  streak_30: '#FFDDB8',
  focus_10h: '#3B82F6',
  focus_50h: '#FFB95F',
  focus_200h: '#D2BBFF',
  deep_10: '#7C3AED',
  hardcore_5: '#FFB4AB',
  level_5: '#4FDBC8',
  level_10: '#FFB95F',
  perfect_week: '#D2BBFF',
};

const ACHIEVEMENT_NAMES: Record<string, string> = {
  first_session: 'First Focus',
  streak_3: 'Getting Started',
  streak_7: 'Week Warrior',
  streak_30: 'Monthly Master',
  focus_10h: 'Time Investor',
  focus_50h: 'Focus Champion',
  focus_200h: 'Focus Master',
  deep_10: 'Deep Diver',
  hardcore_5: 'Iron Will',
  level_5: 'Rising Star',
  level_10: 'Focus Expert',
  perfect_week: 'Perfect Week',
};

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchAchievements();
    }
  }, [user?.id]);

  const fetchAchievements = async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user?.id)
      .order('unlocked_at', { ascending: false });

    if (!error && data) {
      setAchievements(data);
    }
  };

  const allAchievementIds = Object.keys(ACHIEVEMENT_NAMES);
  const unlockedIds = new Set(achievements.filter(a => a.completed).map(a => a.achievement_id));
  const unlockedCount = unlockedIds.size || 4; // Mock fallback
  const totalCount = allAchievementIds.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={26} color="#FFB95F" />
          <Text style={styles.headerTitle}>Achievements</Text>
        </View>

        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Overview Glass Card */}
        <GlassCard style={styles.progressCard}>
          <View style={styles.progressRingCircle}>
            <Text style={styles.progressRingPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressDetails}>
            <Text style={styles.progressTitle}>Vault Collection Progress</Text>
            <Text style={styles.progressSubtitle}>{unlockedCount} of {totalCount} Trophies Unlocked</Text>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </GlassCard>

        {/* Section Header */}
        <Text style={styles.sectionTitle}>Trophy Cabinet</Text>

        {/* Grid of Achievements */}
        <View style={styles.grid}>
          {allAchievementIds.map((id, index) => {
            const isUnlocked = unlockedIds.has(id) || index < 4; // Mock unlock for first 4 for demonstration
            const iconName = ACHIEVEMENT_ICONS[id] || 'trophy-outline';
            const iconColor = ACHIEVEMENT_COLORS[id] || '#7C3AED';

            return (
              <GlassCard
                key={id}
                style={[styles.achievementCard, !isUnlocked ? styles.achievementCardLocked : undefined]}
              >
                <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? `${iconColor}20` : 'rgba(255,255,255,0.03)' }]}>
                  <Ionicons name={iconName} size={24} color={isUnlocked ? iconColor : '#525252'} />
                </View>
                <Text style={styles.achievementName} numberOfLines={1}>
                  {ACHIEVEMENT_NAMES[id]}
                </Text>
                <View style={[styles.badgePill, isUnlocked ? styles.badgePillUnlocked : styles.badgePillLocked]}>
                  <Text style={[styles.badgeText, isUnlocked ? styles.badgeTextUnlocked : styles.badgeTextLocked]}>
                    {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E5E2E1',
    letterSpacing: -0.5,
  },
  headerIconButton: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  progressRingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D2BBFF',
  },
  progressDetails: {
    flex: 1,
    gap: 4,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E2E1',
  },
  progressSubtitle: {
    fontSize: 12,
    color: '#CCC3D8',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E2E1',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E2E1',
    textAlign: 'center',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgePillUnlocked: {
    backgroundColor: 'rgba(79, 219, 200, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79, 219, 200, 0.3)',
  },
  badgePillLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextUnlocked: {
    color: '#4FDBC8',
  },
  badgeTextLocked: {
    color: '#958DA1',
  },
});
