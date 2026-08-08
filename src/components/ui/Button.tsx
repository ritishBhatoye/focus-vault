import React from 'react';
import { Text, ActivityIndicator, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { PressableScale } from '../animations';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'gradient':
        return '#FFFFFF';
      case 'secondary':
        return '#E5E2E1';
      case 'danger':
        return '#FFB4AB';
      case 'ghost':
        return '#7C3AED';
      default:
        return '#FFFFFF';
    }
  };

  if (variant === 'gradient' || variant === 'primary') {
    return (
      <PressableScale
        onPress={handlePress}
        disabled={disabled || loading}
        style={[styles.buttonWrapper, style, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={['#7C3AED', '#04B4A2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles.gradientButton, styles[size]]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.innerContent}>
              {icon && <View style={styles.icon}>{icon}</View>}
              <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </PressableScale>
    );
  }

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      case 'danger':
        return styles.danger;
      default:
        return styles.secondary;
    }
  };

  return (
    <PressableScale
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.button, getVariantStyle(), styles[size], style, disabled && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'danger' ? '#FFB4AB' : '#7C3AED'}
          size="small"
        />
      ) : (
        <View style={styles.innerContent}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  gradientButton: {
    width: '100%',
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: 'rgba(147, 0, 10, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.3)',
  },
  sm: {
    height: 40,
    paddingHorizontal: 16,
  },
  md: {
    height: 56,
    paddingHorizontal: 24,
  },
  lg: {
    height: 64,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});

