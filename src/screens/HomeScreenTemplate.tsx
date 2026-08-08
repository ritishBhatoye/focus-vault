/**
 * Home Screen Template
 * 
 * This is a starting point based on the design spec.
 * Customize colors, spacing, and layouts once you see the Stitch output.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const BlurView = ({ children, style }: any) => <View style={style}>{children}</View>;

const { width } = Dimensions.get('window');

// TODO: Update these colors with exact values from Stitch
const COLORS = {
  primary: '#7C3AED',
  secondary: '#14B8A6',
  accent: '#F59E0B',
  background: '#000000',
  surface: '#0A0A0A',
  text: '#FFFFFF',
  textMuted: '#A3A3A3',
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

type FocusMode = 'shallow' | 'deep' | 'hardcore';

export default function HomeScreen() {
  const [duration, setDuration] = useState(25);
  const [mode, setMode] = useState<FocusMode>('shallow');
  const [currentStreak, setCurrentStreak] = useState(15);

  const startSession = () => {
    console.log(`Starting ${mode} session for ${duration} minutes`);
    // TODO: Navigate to active session screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Streak Card */}
        <View style={styles.streakContainer}>
          <BlurView intensity={20} tint="dark" style={styles.streakBlur}>
            <View style={styles.streakCard}>
              <Text style={styles.streakText}>
                🔥 {currentStreak} Day Streak
              </Text>
              {/* Streak health bar - TODO: Add if needed from Stitch */}
            </View>
          </BlurView>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSection}>
          <Text style={styles.sectionLabel}>Focus Mode</Text>
          <View style={styles.modePills}>
            <ModePill
              label="Shallow"
              selected={mode === 'shallow'}
              onPress={() => setMode('shallow')}
            />
            <ModePill
              label="Deep"
              selected={mode === 'deep'}
              onPress={() => setMode('deep')}
            />
            <ModePill
              label="Hardcore"
              selected={mode === 'hardcore'}
              onPress={() => setMode('hardcore')}
              icon="🔒"
            />
          </View>
        </View>

        {/* Duration Picker - Simplified for now */}
        {/* TODO: Replace with circular picker from Stitch if available */}
        <View style={styles.durationSection}>
          <BlurView intensity={20} tint="dark" style={styles.durationBlur}>
            <View style={styles.durationCard}>
              <Text style={styles.durationNumber}>{duration}</Text>
              <Text style={styles.durationLabel}>MINUTES</Text>
              <Text style={styles.xpEstimate}>~{duration * 10} XP</Text>
              
              {/* Quick duration buttons */}
              <View style={styles.durationButtons}>
                {[15, 25, 45, 60].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setDuration(mins)}
                    style={[
                      styles.durationButton,
                      duration === mins && styles.durationButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        duration === mins && styles.durationButtonTextActive,
                      ]}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </BlurView>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          onPress={startSession}
          activeOpacity={0.8}
          style={styles.startButton}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGradient}
          >
            <Text style={styles.startButtonText}>
              Start {mode.charAt(0).toUpperCase() + mode.slice(1)} Session
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Mode Pill Component
function ModePill({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.modePill, selected && styles.modePillSelected]}
    >
      {icon && <Text style={styles.modePillIcon}>{icon}</Text>}
      <Text style={[styles.modePillText, selected && styles.modePillTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 24,
  },

  // Streak Card
  streakContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.glassBackground,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  streakBlur: {
    padding: 16,
  },
  streakCard: {
    alignItems: 'center',
  },
  streakText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },

  // Mode Selector
  modeSection: {
    gap: 12,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modePills: {
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.glassBackground,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  modePillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modePillIcon: {
    fontSize: 16,
  },
  modePillText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  modePillTextSelected: {
    color: COLORS.text,
  },

  // Duration Card
  durationSection: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.glassBackground,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  durationBlur: {
    flex: 1,
  },
  durationCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  durationNumber: {
    color: COLORS.text,
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
  },
  durationLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  xpEstimate: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.glassBackground,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  durationButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: COLORS.primary,
  },
  durationButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  durationButtonTextActive: {
    color: COLORS.primary,
  },

  // Start Button
  startButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
