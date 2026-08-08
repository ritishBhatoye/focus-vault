import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, StatCard } from '@/components/ui';
import { PressableScale } from '@/components/animations';
import { useAuthStore, useAnalyticsStore } from '@/stores';
import { analyticsService } from '@/services';

type TimeRange = 'week' | 'month' | 'all';

const BAR_DATA = [
  { day: 'M', deep: 40, flow: 20, read: 0 },
  { day: 'T', deep: 60, flow: 0, read: 0 },
  { day: 'W', deep: 0, flow: 50, read: 30 },
  { day: 'T', deep: 80, flow: 0, read: 0 },
  { day: 'F', deep: 20, flow: 0, read: 40 },
  { day: 'S', deep: 0, flow: 15, read: 0 },
  { day: 'S', deep: 10, flow: 0, read: 0 },
];

const HISTORY = [
  { title: 'Architecture Study', time: 'Today, 2:00 PM', duration: '45m', mode: 'Deep', color: '#7C3AED' },
  { title: 'UI Implementation', time: 'Today, 10:15 AM', duration: '90m', mode: 'Flow', color: '#4FDBC8' },
  { title: 'Morning Reading', time: 'Today, 8:00 AM', duration: '30m', mode: 'Read', color: '#FFB95F' },
];

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const { analytics } = useAnalyticsStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  useEffect(() => {
    if (user?.id) {
      analyticsService.fetchUserAnalytics(user.id);
    }
  }, [user?.id]);

  const totalTimeDisplay = '4h 12m';
  const streakDisplay = `${analytics.currentStreak || 15}d`;
  const levelDisplay = `${analytics.level || 8}`;
  const xpDisplay = (analytics.xpEarned || 8450).toLocaleString();

  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogoCircle}>
            <Ionicons name="stats-chart" size={18} color="#7C3AED" />
          </View>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="download-outline" size={20} color="#958DA1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          {ranges.map((r) => (
            <PressableScale
              key={r.key}
              onPress={() => setTimeRange(r.key)}
              style={[styles.segmentButton, timeRange === r.key && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, timeRange === r.key && styles.segmentTextActive]}>
                {r.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* 2x2 Glass Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.gridRow}>
            <StatCard
              label="24hr Total"
              value={totalTimeDisplay}
              icon={<Ionicons name="time-outline" size={16} color="#D2BBFF" />}
            />
            <StatCard
              label="Streak"
              value={streakDisplay}
              icon={<Ionicons name="flame" size={16} color="#FFB95F" />}
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="Level"
              value={levelDisplay}
              icon={<Ionicons name="medal-outline" size={16} color="#4FDBC8" />}
            />
            <StatCard
              label="XP"
              value={xpDisplay}
              icon={<Ionicons name="flash" size={16} color="#7C3AED" />}
            />
          </View>
        </View>

        {/* Focus Distribution Chart */}
        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Focus Distribution</Text>
            <Text style={styles.chartSubtitle}>Last 7 days</Text>
          </View>

          <View style={styles.chartContainer}>
            {BAR_DATA.map((bar, i) => {
              const maxH = 100;
              const total = bar.deep + bar.flow + bar.read;
              return (
                <View key={i} style={styles.chartCol}>
                  <View style={styles.barStack}>
                    {bar.deep > 0 && (
                      <LinearGradient
                        colors={['#9B69F7', '#7C3AED']}
                        style={[styles.barSegment, { height: `${(bar.deep / maxH) * 100}%` }]}
                      />
                    )}
                    {bar.flow > 0 && (
                      <LinearGradient
                        colors={['#6FE8D6', '#4FDBC8']}
                        style={[styles.barSegment, { height: `${(bar.flow / maxH) * 100}%` }]}
                      />
                    )}
                    {bar.read > 0 && (
                      <LinearGradient
                        colors={['#FFC97A', '#FFB95F']}
                        style={[styles.barSegment, { height: `${(bar.read / maxH) * 100}%` }]}
                      />
                    )}
                  </View>
                  <Text style={[styles.dayLabel, total > 60 && styles.dayLabelActive]}>
                    {bar.day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Chart Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
              <Text style={styles.legendText}>Deep</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#4FDBC8' }]} />
              <Text style={styles.legendText}>Flow</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#FFB95F' }]} />
              <Text style={styles.legendText}>Read</Text>
            </View>
          </View>
        </GlassCard>

        {/* Session History */}
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>Session History</Text>

          <View style={styles.historyList}>
            {HISTORY.map((item, i) => (
              <GlassCard key={i} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={[styles.historyDot, { backgroundColor: item.color }]} />
                  <View style={styles.historyMain}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyTime}>{item.time}</Text>
                  </View>
                </View>
                <View style={styles.historyMeta}>
                  <Text style={[styles.historyDuration, { color: item.color }]}>
                    {item.duration}
                  </Text>
                  <View style={[styles.badgePill, { borderColor: `${item.color}40` }]}>
                    <Text style={[styles.badgeText, { color: item.color }]}>{item.mode}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#958DA1',
  },
  segmentTextActive: {
    color: '#D2BBFF',
    fontWeight: '700',
  },

  // Stats Grid
  statsGrid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Chart Card
  chartCard: {
    padding: 20,
    gap: 16,
    borderRadius: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E5E2E1',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#958DA1',
    fontWeight: '500',
  },
  chartContainer: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 10,
    paddingTop: 8,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barStack: {
    width: '70%',
    height: '85%',
    justifyContent: 'flex-end',
    gap: 2,
  },
  barSegment: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#958DA1',
    fontWeight: '500',
  },
  dayLabelActive: {
    color: '#D2BBFF',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#CCC3D8',
    fontWeight: '500',
  },

  // Session History
  historySection: {
    gap: 12,
  },
  historySectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CCC3D8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  historyList: {
    gap: 8,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyDot: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  historyMain: {
    gap: 3,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E2E1',
  },
  historyTime: {
    fontSize: 12,
    color: '#958DA1',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyDuration: {
    fontSize: 18,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
