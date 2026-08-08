import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, className = '', elevated = false, style }: CardProps) {
  return (
    <View
      className={className}
      style={[
        styles.container,
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconColor?: string;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ label, value, icon, iconColor, trend }: StatCardProps) {
  return (
    <GlassCard style={styles.statCard}>
      <View style={styles.statHeader}>
        {icon && <View style={styles.statIconContainer}>{icon}</View>}
        <Text style={styles.statLabel}>{label}</Text>
        {trend && (
          <Text
            style={[
              styles.trendText,
              { color: trend.positive ? '#10B981' : '#FFB4AB' }
            ]}
          >
            {trend.positive ? '+' : ''}{trend.value}%
          </Text>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  elevated: {
    backgroundColor: '#131313',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E5E2E1',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCC3D8',
    fontWeight: '500',
  },
});

