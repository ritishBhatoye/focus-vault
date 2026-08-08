import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface CircularTimerPickerProps {
  duration: number; // in minutes (e.g. 5 - 120)
  onDurationChange: (minutes: number) => void;
  size?: number;
  minDuration?: number;
  maxDuration?: number;
  step?: number;
}

export function CircularTimerPicker({
  duration,
  onDurationChange,
  size = 256,
  minDuration = 5,
  maxDuration = 120,
  step = 5,
}: CircularTimerPickerProps) {
  const strokeWidth = 8;
  const radius = (size - 32) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Fraction of the circle filled based on duration
  const progress = (duration - minDuration) / (maxDuration - minDuration);
  // Dashoffset calculation (0 to circumference)
  const strokeDashoffset = circumference * (1 - Math.max(0.05, Math.min(1, progress)));

  // Angle in radians for handle positioning
  const angle = progress * 2 * Math.PI - Math.PI / 2;
  const handleX = center + radius * Math.cos(angle);
  const handleY = center + radius * Math.sin(angle);

  const calculateDurationFromTouch = (gestureX: number, gestureY: number) => {
    // Calculate angle from center of picker
    const dx = gestureX - center;
    const dy = gestureY - center;
    let rad = Math.atan2(dy, dx) + Math.PI / 2;
    if (rad < 0) {
      rad += 2 * Math.PI;
    }
    const touchedProgress = rad / (2 * Math.PI);
    let newDuration = minDuration + touchedProgress * (maxDuration - minDuration);
    // Round to nearest step
    newDuration = Math.round(newDuration / step) * step;
    newDuration = Math.max(minDuration, Math.min(maxDuration, newDuration));

    if (newDuration !== duration) {
      Haptics.selectionAsync();
      onDurationChange(newDuration);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        calculateDurationFromTouch(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        calculateDurationFromTouch(locationX, locationY);
      },
    })
  ).current;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#171717"
          strokeWidth={4}
          fill="none"
        />
        {/* Progress Arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#7C3AED"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Drag handle overlay */}
      <View
        {...panResponder.panHandlers}
        style={[
          styles.touchOverlay,
          { width: size, height: size }
        ]}
      >
        <View
          style={[
            styles.handle,
            {
              left: handleX - 10,
              top: handleY - 10,
            },
          ]}
        />
      </View>

      {/* Center Display */}
      <View style={styles.centerContent} pointerEvents="none">
        <Text style={styles.durationNumber}>{duration}</Text>
        <Text style={styles.durationLabel}>MIN</Text>
        <Text style={styles.xpEstimate}>~{duration * 10} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  touchOverlay: {
    position: 'absolute',
    borderRadius: 999,
  },
  handle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    borderWidth: 3,
    borderColor: '#131313',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#D2BBFF',
    letterSpacing: -1,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCC3D8',
    letterSpacing: 2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  xpEstimate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4FDBC8',
    marginTop: 8,
  },
});
