// src/ui/forms/Switch.tsx
/**
 * Switch Component
 * 
 * Toggle switch with smooth animations
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
  hapticFeedback?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'md',
  color,
  style,
  hapticFeedback = true,
}) => {
  const { colors, tokens } = useTheme();
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;
  const backgroundColor = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(backgroundColor, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value]);

  const getSizes = () => {
    switch (size) {
      case 'sm':
        return { width: 36, height: 20, thumb: 16, padding: 2 };
      case 'lg':
        return { width: 56, height: 32, thumb: 28, padding: 2 };
      case 'md':
      default:
        return { width: 48, height: 28, thumb: 24, padding: 2 };
    }
  };

  const sizes = getSizes();

  const handlePress = () => {
    if (disabled) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onValueChange(!value);
  };

  const activeColor = color || colors.primary;
  const inactiveColor = colors.neutral[300];

  const interpolatedColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  const thumbTranslate = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sizes.width - sizes.thumb - sizes.padding * 2],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={style}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: sizes.width,
            height: sizes.height,
            backgroundColor: interpolatedColor,
            opacity: disabled ? 0.5 : 1,
            padding: sizes.padding,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: sizes.thumb,
              height: sizes.thumb,
              transform: [{ translateX: thumbTranslate }],
              backgroundColor: colors.neutral[0],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    justifyContent: 'center',
  },
  
  thumb: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
