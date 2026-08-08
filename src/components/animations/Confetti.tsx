import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPieceProps {
  index: number;
  onComplete?: () => void;
}

const CONFETTI_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'];

interface RandomParams {
  startX: number;
  endX: number;
  duration: number;
  delay: number;
  rotateDirection: number;
  size: number;
  isCircle: boolean;
}

function ConfettiPiece({ index }: ConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(SCREEN_WIDTH / 2);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];

  const [randomParams] = useState<RandomParams>(() => {
    const startX = Math.random() * SCREEN_WIDTH;
    const endX = startX + (Math.random() - 0.5) * 200;
    const duration = 2000 + Math.random() * 1000;
    const delay = Math.random() * 500;
    const rotateDirection = Math.random() > 0.5 ? 1 : -1;
    const size = 8 + Math.random() * 8;
    const isCircle = Math.random() > 0.5;

    return {
      startX,
      endX,
      duration,
      delay,
      rotateDirection,
      size,
      isCircle,
    };
  });

  const { startX, endX, duration, delay, rotateDirection, size, isCircle } = randomParams;


  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming(endX, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * rotateDirection * 3, {
        duration,
        easing: Easing.linear,
      })
    );
    opacity.value = withDelay(
      delay + duration - 500,
      withTiming(0, { duration: 500 })
    );
  }, [delay, duration, endX, opacity, rotate, rotateDirection, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          width: isCircle ? size : size * 1.5,
          height: isCircle ? size : size * 0.6,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
          left: startX,
        },
        animatedStyle,
      ]}
    />
  );
}


interface ConfettiProps {
  visible: boolean;
  pieceCount?: number;
}

export function Confetti({ visible, pieceCount = 50 }: ConfettiProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: pieceCount }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
});
