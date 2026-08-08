import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, Button } from '@/components/ui';
import { PressableScale } from '@/components/animations';
import { useAuthStore, useAppBlockStore, useFeatureFlagStore, useAnalyticsStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingRow({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  rightElement,
  onPress,
  isLast = false,
}: SettingRowProps) {
  const content = (
    <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
      <View style={[styles.iconBox, { backgroundColor: iconBgColor || `${iconColor}18` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={18} color="#958DA1" />)}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress}>
        {content}
      </PressableScale>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { blockedApps } = useAppBlockStore();
  const { flags, setFlag } = useFeatureFlagStore();
  const { analytics } = useAnalyticsStore();

  const [notifications, setNotifications] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const handleToggleNotification = (val: boolean) => {
    Haptics.selectionAsync();
    setNotifications(val);
  };

  const handleToggleFlag = (key: string, val: boolean) => {
    Haptics.selectionAsync();
    setFlag(key, val);
  };

  const handleToggleHaptics = (val: boolean) => {
    if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHapticsEnabled(val);
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of FocusVault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your session data, XP, and streak history will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion Requested', 'Please contact support@focusvault.app to finalize deletion.');
          },
        },
      ]
    );
  };

  const userEmail = user?.email || 'user@focusvault.app';
  const userTier = user?.subscription_tier?.toUpperCase() || 'PRO';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <GlassCard style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.2)', 'rgba(4, 180, 162, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileTop}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={32} color="#D2BBFF" />
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>LVL {analytics.level || 8}</Text>
                </View>
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userNameText}>Disciplined User</Text>
                  <View style={styles.tierBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#4FDBC8" />
                    <Text style={styles.tierBadgeText}>{userTier}</Text>
                  </View>
                </View>
                <Text style={styles.userEmailText}>{userEmail}</Text>
              </View>
            </View>

            <View style={styles.profileDivider} />

            {/* Quick Stats Grid inside Profile */}
            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>42h 12m</Text>
                <Text style={styles.profileStatLabel}>Focused</Text>
              </View>
              <View style={styles.profileStatBorder} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{analytics.currentStreak || 15}d 🔥</Text>
                <Text style={styles.profileStatLabel}>Streak</Text>
              </View>
              <View style={styles.profileStatBorder} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{(analytics.xpEarned || 8450).toLocaleString()}</Text>
                <Text style={styles.profileStatLabel}>XP</Text>
              </View>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Section: Account & Subscription */}
        <Text style={styles.sectionHeader}>Account & Membership</Text>
        <GlassCard style={styles.cardGroup}>
          <SettingRow
            icon="mail-outline"
            iconColor="#D2BBFF"
            title="Email Address"
            subtitle={userEmail}
          />
          <SettingRow
            icon="card-outline"
            iconColor="#4FDBC8"
            title="Subscription Tier"
            subtitle={`${userTier} Access • Unlimited Focus Sessions`}
            rightElement={
              <View style={styles.proBadgePill}>
                <Text style={styles.proBadgeText}>Active</Text>
              </View>
            }
            isLast
          />
        </GlassCard>

        {/* Section: Focus Controls */}
        <Text style={styles.sectionHeader}>Focus & Shield Rules</Text>
        <GlassCard style={styles.cardGroup}>
          <SettingRow
            icon="notifications-outline"
            iconColor="#7C3AED"
            title="Push Notifications"
            subtitle="Session reminders and streak health alerts"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={handleToggleNotification}
                trackColor={{ false: '#201F1F', true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            icon="flame-outline"
            iconColor="#FFB4AB"
            title="Hardcore Mode"
            subtitle="Lock sessions strictly with zero early exit"
            rightElement={
              <Switch
                value={flags.enable_hardcore_mode ?? true}
                onValueChange={(v) => handleToggleFlag('enable_hardcore_mode', v)}
                trackColor={{ false: '#201F1F', true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            icon="qr-code-outline"
            iconColor="#FFB95F"
            title="QR Code Unlock"
            subtitle="Require partner QR code for early unlock"
            rightElement={
              <Switch
                value={flags.enable_qr_unlock ?? true}
                onValueChange={(v) => handleToggleFlag('enable_qr_unlock', v)}
                trackColor={{ false: '#201F1F', true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            icon="hardware-chip-outline"
            iconColor="#4FDBC8"
            title="Haptic Feedback"
            subtitle="Vibration feedback on timer & actions"
            rightElement={
              <Switch
                value={hapticsEnabled}
                onValueChange={handleToggleHaptics}
                trackColor={{ false: '#201F1F', true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            }
            isLast
          />
        </GlassCard>

        {/* Section: App Blocking */}
        <Text style={styles.sectionHeader}>Distraction Shield</Text>
        <GlassCard style={styles.cardGroup}>
          <SettingRow
            icon="apps-outline"
            iconColor="#3B82F6"
            title="Blocked Applications"
            subtitle={`${blockedApps.length || 12} apps shielded during focus`}
            onPress={() => {
              Alert.alert('Shield Manager', 'Distraction app blocking rules are active during sessions.');
            }}
            isLast
          />
        </GlassCard>

        {/* Section: Support */}
        <Text style={styles.sectionHeader}>Support & Resources</Text>
        <GlassCard style={styles.cardGroup}>
          <SettingRow
            icon="help-circle-outline"
            iconColor="#CCC3D8"
            title="Help Center & FAQ"
            onPress={() => {}}
          />
          <SettingRow
            icon="shield-outline"
            iconColor="#CCC3D8"
            title="Privacy Policy"
            onPress={() => {}}
          />
          <SettingRow
            icon="document-text-outline"
            iconColor="#CCC3D8"
            title="Terms of Service"
            onPress={() => {}}
            isLast
          />
        </GlassCard>

        {/* Section: Account Actions */}
        <Text style={styles.sectionHeader}>Account Actions</Text>
        <GlassCard style={styles.cardGroup}>
          <View style={styles.buttonStack}>
            <Button
              title="Sign Out"
              variant="secondary"
              onPress={handleLogout}
              icon={<Ionicons name="log-out-outline" size={18} color="#E5E2E1" />}
            />
            <Button
              title="Delete Account"
              variant="danger"
              onPress={handleDeleteAccount}
              icon={<Ionicons name="trash-outline" size={18} color="#FFB4AB" />}
            />
          </View>
        </GlassCard>

        {/* Footer info */}
        <View style={styles.footerContainer}>
          <Text style={styles.versionText}>FocusVault v1.2.0 (Build 2026.1)</Text>
          <Text style={styles.taglineText}>Built for day 45, not day 1.</Text>
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
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Profile Card
  profileCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileGradient: {
    padding: 20,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
    gap: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E2E1',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 180, 162, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79, 219, 200, 0.3)',
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4FDBC8',
  },
  userEmailText: {
    fontSize: 13,
    color: '#CCC3D8',
  },
  profileDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  profileStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E2E1',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#CCC3D8',
  },
  profileStatBorder: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CCC3D8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 12,
    marginLeft: 4,
  },
  cardGroup: {
    padding: 4,
    borderRadius: 16,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E2E1',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#CCC3D8',
    marginTop: 2,
  },
  proBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(79, 219, 200, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79, 219, 200, 0.3)',
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4FDBC8',
  },

  // Buttons
  buttonStack: {
    padding: 12,
    gap: 12,
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#CCC3D8',
    fontWeight: '500',
  },
  taglineText: {
    fontSize: 12,
    color: 'rgba(204, 195, 216, 0.5)',
    fontStyle: 'italic',
  },
});
