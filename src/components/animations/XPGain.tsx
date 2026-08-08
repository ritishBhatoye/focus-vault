import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface XPGainAnimationProps {
  xp: number;
  onComplete?: () => void;
}

export function XPGainAnimation({ xp, onComplete }: XPGainAnimationProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );

    translateY.value = withSequence(
      withTiming(-20, { duration: 400 }),
      withTiming(-80, { duration: 800 }),
      withTiming(-100, { duration: 400 })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 400 })
    );

    if (onComplete) {
      const timeout = setTimeout(onComplete, 1500);
      return () => clearTimeout(timeout);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.xpText}>+{xp} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderRadius: 20,
    zIndex: 100,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});
