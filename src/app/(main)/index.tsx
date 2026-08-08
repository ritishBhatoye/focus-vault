import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, Button, CircularTimerPicker } from '@/components/ui';
import { PressableScale } from '@/components/animations';
import { useFocusSessionStore, useAnalyticsStore } from '@/stores';
import type { FocusMode } from '@/types';

const MODES: { key: FocusMode; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'shallow', label: 'Shallow', icon: 'water-outline', color: '#4FDBC8' },
  { key: 'deep', label: 'Deep', icon: 'flame-outline', color: '#7C3AED' },
  { key: 'hardcore', label: 'Hardcore', icon: 'skull-outline', color: '#FFB4AB' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { startSession } = useFocusSessionStore();
  const { analytics } = useAnalyticsStore();

  const [duration, setDuration] = useState(25);
  const [mode, setMode] = useState<FocusMode>('deep');

  const currentStreak = analytics.currentStreak || 15;
  const estimatedXP = duration * 10;
  const selectedMode = MODES.find(m => m.key === mode)!;

  const handleStartSession = () => {
    const isHardcore = mode === 'hardcore';
    startSession(mode, duration, isHardcore);
    router.push('/session');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogoCircle}>
            <Ionicons name="shield-half-outline" size={20} color="#7C3AED" />
          </View>
          <Text style={styles.headerTitle}>FocusVault</Text>
        </View>
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color="#958DA1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Streak Badge */}
        <View style={styles.streakWrapper}>
          <GlassCard style={styles.streakCard}>
            <LinearGradient
              colors={['rgba(255, 185, 95, 0.15)', 'rgba(255, 185, 95, 0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakGradient}
            >
              <View style={styles.streakIconCircle}>
                <Ionicons name="flame" size={18} color="#FFB95F" />
              </View>
              <Text style={styles.streakValue}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </LinearGradient>
          </GlassCard>
        </View>

        {/* Circular Duration Picker */}
        <View style={styles.pickerSection}>
          <CircularTimerPicker
            duration={duration}
            onDurationChange={setDuration}
            size={260}
            minDuration={5}
            maxDuration={120}
            step={5}
          />
        </View>

        {/* XP Estimation */}
        <View style={styles.xpRow}>
          <Ionicons name="flash" size={16} color="#7C3AED" />
          <Text style={styles.xpText}>~{estimatedXP} XP</Text>
          <Text style={styles.xpSep}>•</Text>
          <Ionicons name="time-outline" size={14} color="#958DA1" />
          <Text style={styles.xpDuration}>{duration} min</Text>
        </View>

        {/* Focus Mode Selection */}
        <View style={styles.modeSectionWrapper}>
          <Text style={styles.modeSectionLabel}>Focus Mode</Text>
          <View style={styles.modeSection}>
            {MODES.map((m) => {
              const isActive = mode === m.key;
              return (
                <PressableScale
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[
                    styles.modePill,
                    isActive && {
                      backgroundColor: `${m.color}25`,
                      borderColor: `${m.color}60`,
                      shadowColor: m.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 4,
                    },
                  ]}
                >
                  <Ionicons
                    name={m.icon as any}
                    size={18}
                    color={isActive ? m.color : '#958DA1'}
                  />
                  <Text
                    style={[
                      styles.modePillText,
                      isActive && { color: m.color, fontWeight: '700' },
                    ]}
                  >
                    {m.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Start Session Button */}
        <View style={styles.actionSection}>
          <Button
            title="Start Session"
            variant="gradient"
            onPress={handleStartSession}
            icon={<Ionicons name="play" size={20} color="#FFFFFF" />}
            style={styles.startButton}
          />
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
  headerLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E5E2E1',
    letterSpacing: -0.5,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Streak Badge
  streakWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  streakCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.15)',
    maxWidth: 200,
    width: '100%',
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  streakIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 185, 95, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFB95F',
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCC3D8',
  },

  // Picker Section
  pickerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // XP Row
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D2BBFF',
  },
  xpSep: {
    fontSize: 12,
    color: '#958DA1',
    marginHorizontal: 2,
  },
  xpDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCC3D8',
  },

  // Mode Section
  modeSectionWrapper: {
    width: '100%',
    gap: 12,
  },
  modeSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CCC3D8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  modeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modePillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#958DA1',
  },

  // Action Section
  actionSection: {
    width: '100%',
    marginTop: 4,
  },
  startButton: {
    width: '100%',
  },
});
