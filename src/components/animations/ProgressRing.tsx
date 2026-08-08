import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 12,
  backgroundColor = '#2A2A2A',
  progressColor = '#3B82F6',
  children,
}: ProgressRingProps) {
  const animatedProgress = useDerivedValue(() => {
    return withTiming(progress, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      animatedProgress.value,
      [0, 100],
      [-90, 270]
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const circumference = (size - strokeWidth) * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.svgContainer}>
        <View
          style={[
            styles.circle,
            {
              width: size - strokeWidth,
              height: size - strokeWidth,
              borderRadius: (size - strokeWidth) / 2,
              borderWidth: strokeWidth / 2,
              borderColor: backgroundColor,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.progressCircle,
            {
              width: size - strokeWidth,
              height: size - strokeWidth,
              borderRadius: (size - strokeWidth) / 2,
              borderWidth: strokeWidth / 2,
              borderColor: progressColor,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [{ rotate: '-45deg' }],
            },
            animatedStyle,
          ]}
        />
      </View>
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  circle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  childrenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
