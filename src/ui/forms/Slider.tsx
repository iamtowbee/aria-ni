// src/ui/forms/Slider.tsx
/**
 * Slider Component
 * 
 * Range slider with smooth animations and haptic feedback
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  PanResponder,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  color?: string;
  style?: ViewStyle;
  hapticFeedback?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  showValue = false,
  color,
  style,
  hapticFeedback = true,
}) => {
  const { colors, tokens } = useTheme();
  const sliderWidth = useRef(0);
  const lastHapticValue = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        if (hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const percentage = Math.max(0, Math.min(1, gestureState.moveX / sliderWidth.current));
        const range = maximumValue - minimumValue;
        let newValue = minimumValue + (percentage * range);
        
        // Snap to step
        newValue = Math.round(newValue / step) * step;
        newValue = Math.max(minimumValue, Math.min(maximumValue, newValue));

        if (newValue !== value) {
          onValueChange(newValue);

          // Haptic feedback on value change
          if (hapticFeedback && Math.abs(newValue - lastHapticValue.current) >= step) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            lastHapticValue.current = newValue;
          }
        }
      },
      onPanResponderRelease: () => {
        if (hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
    })
  ).current;

  const getPercentage = (): number => {
    const range = maximumValue - minimumValue;
    return ((value - minimumValue) / range) * 100;
  };

  const percentage = getPercentage();
  const activeColor = color || colors.primary;

  return (
    <View style={[styles.container, style]}>
      {showValue && (
        <Text
          style={[
            styles.valueText,
            {
              color: colors.text.primary,
              fontSize: tokens.typography.fontSize.sm,
              marginBottom: tokens.spacing[2],
            },
          ]}
        >
          {value}
        </Text>
      )}

      <View
        style={styles.sliderContainer}
        onLayout={(e) => {
          sliderWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Track */}
        <View
          style={[
            styles.track,
            {
              backgroundColor: colors.neutral[200],
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {/* Active Track */}
          <View
            style={[
              styles.activeTrack,
              {
                width: `${percentage}%`,
                backgroundColor: activeColor,
              },
            ]}
          />
        </View>

        {/* Thumb */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.thumb,
            {
              left: `${percentage}%`,
              backgroundColor: activeColor,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        />
      </View>

      {/* Min/Max Labels */}
      <View style={styles.labels}>
        <Text
          style={[
            styles.label,
            {
              color: colors.text.secondary,
              fontSize: tokens.typography.fontSize.xs,
            },
          ]}
        >
          {minimumValue}
        </Text>
        <Text
          style={[
            styles.label,
            {
              color: colors.text.secondary,
              fontSize: tokens.typography.fontSize.xs,
            },
          ]}
        >
          {maximumValue}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  
  valueText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  activeTrack: {
    height: '100%',
    borderRadius: 2,
  },
  
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  
  label: {
    fontWeight: '500',
  },
});
