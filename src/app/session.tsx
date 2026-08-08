import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, Button } from '@/components/ui';
import { ProgressRing, Confetti, XPGainAnimation } from '@/components/animations';
import { useFocusSessionStore, useAnalyticsStore } from '@/stores';
import { focusSessionService, qrUnlockService } from '@/services';
import * as Haptics from 'expo-haptics';

export default function SessionScreen() {
  const router = useRouter();
  const { sessionState, remainingSeconds, updateRemainingTime } = useFocusSessionStore();
  const { incrementTodaySessions } = useAnalyticsStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    focusSessionService.checkAndRestoreOfflineSession();
  }, []);

  // Pulse animation for the status dot
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Timer interval countdown tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sessionState.isActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        updateRemainingTime(remainingSeconds - 1);
      }, 1000);
    } else if (remainingSeconds <= 0 && sessionState.isActive) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [sessionState.isActive, remainingSeconds]);

  const handleSessionComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfetti(true);
    
    const result = await focusSessionService.completeSession();
    setXpGained(result.xpEarned);
    incrementTodaySessions();
    
    setTimeout(() => {
      router.replace('/(main)');
    }, 3000);
  };

  const handleUnlockRequest = () => {
    if (sessionState.mode === 'hardcore') {
      Alert.alert(
        'Hardcore Mode Active',
        'Hardcore mode sessions cannot be unlocked early. Focus until completion!',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Request Unlock?',
      'Unlocking early will forfeit 50% of your earned XP. Are you sure you want to end this session?',
      [
        { text: 'Keep Focusing', style: 'cancel' },
        { 
          text: 'Request Unlock', 
          style: 'destructive',
          onPress: async () => {
            focusSessionService.cancelSession();
            router.replace('/(main)');
          }
        },
        {
          text: 'Use QR Unlock',
          onPress: handleQRUnlock
        }
      ]
    );
  };

  const handleQRUnlock = () => {
    Alert.prompt(
      'Enter QR Unlock Code',
      'Enter the code from your QR unlock sheet:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlock',
          onPress: async (code?: string) => {
            if (code) {
              const result = await qrUnlockService.validateQRCode(code);
              if (result.valid) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await focusSessionService.unlockEarly();
                Alert.alert('Session Unlocked', 'Session completed early.');
                router.replace('/(main)');
              } else {
                Alert.alert('Invalid Code', 'The QR code is invalid or expired.');
              }
            }
          }
        },
      ],
      'plain-text'
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = sessionState.duration > 0
    ? ((sessionState.duration * 60 - remainingSeconds) / (sessionState.duration * 60)) * 100
    : 0;

  const modeTitle = sessionState.mode.charAt(0).toUpperCase() + sessionState.mode.slice(1) + ' Focus';
  const estimatedXP = sessionState.duration * 10 || 450;
  const startTimeDisplay = sessionState.startTime 
    ? new Date(sessionState.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '2:30 PM';

  const getModeColor = () => {
    switch (sessionState.mode) {
      case 'hardcore': return '#FFB4AB';
      case 'shallow': return '#4FDBC8';
      default: return '#7C3AED';
    }
  };

  const modeColor = getModeColor();

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && <Confetti visible={showConfetti} pieceCount={80} />}
      
      {xpGained && (
        <XPGainAnimation xp={xpGained} onComplete={() => setXpGained(null)} />
      )}

      {/* Ambient background glow */}
      <View style={[styles.ambientGlow, { backgroundColor: `${modeColor}30` }]} pointerEvents="none" />
      <View style={[styles.ambientGlowSecondary]} pointerEvents="none" />

      {/* Top Status Badge */}
      <View style={styles.header}>
        <GlassCard style={styles.statusBadge}>
          <Animated.View style={[styles.pulseDot, { backgroundColor: modeColor, opacity: pulseAnim }]} />
          <Text style={styles.statusText}>Session Active</Text>
          <View style={[styles.modeBadge, { borderColor: `${modeColor}40` }]}>
            <Text style={[styles.modeBadgeText, { color: modeColor }]}>
              {sessionState.mode.toUpperCase()}
            </Text>
          </View>
        </GlassCard>
      </View>

      {/* Timer Ring Area */}
      <View style={styles.timerSection}>
        <View style={[styles.timerRingWrapper, { shadowColor: modeColor }]}>
          <ProgressRing
            progress={progress}
            size={280}
            strokeWidth={14}
            backgroundColor="#131313"
            progressColor={modeColor}
          >
            <View style={styles.timerCenterContent}>
              <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
              <Text style={[styles.timerLabel, { color: modeColor }]}>REMAINING</Text>
            </View>
          </ProgressRing>
        </View>

        {/* Session Info Glass Card */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.modeIconCircle, { backgroundColor: `${modeColor}18` }]}>
              <Ionicons name="fitness-outline" size={20} color={modeColor} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>{modeTitle}</Text>
              <Text style={styles.infoSubtitle}>Started {startTimeDisplay}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoStatsRow}>
            <View style={styles.infoStatItem}>
              <Ionicons name="medal-outline" size={16} color="#FFB95F" />
              <Text style={styles.xpText}>~{estimatedXP} XP</Text>
            </View>
            <View style={styles.infoStatDivider} />
            <View style={styles.infoStatItem}>
              <Ionicons name="time-outline" size={16} color="#CCC3D8" />
              <Text style={styles.infoStatLabel}>{sessionState.duration} min session</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.actionContainer}>
        <Button
          title="Request Unlock"
          variant="danger"
          onPress={handleUnlockRequest}
          icon={<Ionicons name="lock-closed" size={18} color="#FFB4AB" />}
          style={styles.unlockButton}
        />
        <Text style={styles.forfeitWarningText}>
          Unlocking early will forfeit 50% of XP
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  ambientGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: '28%',
    alignSelf: 'center',
    opacity: 0.5,
  },
  ambientGlowSecondary: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(79, 219, 200, 0.08)',
    bottom: '20%',
    right: -40,
  },
  header: {
    paddingTop: 16,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CCC3D8',
    letterSpacing: 0.3,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerSection: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    zIndex: 10,
  },
  timerRingWrapper: {
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 35,
    elevation: 10,
  },
  timerCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  infoCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E5E2E1',
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#958DA1',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFB95F',
  },
  infoStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CCC3D8',
  },
  actionContainer: {
    width: '100%',
    maxWidth: 420,
    paddingBottom: 28,
    gap: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  unlockButton: {
    width: '100%',
  },
  forfeitWarningText: {
    fontSize: 12,
    color: 'rgba(149, 141, 161, 0.6)',
    textAlign: 'center',
  },
});
