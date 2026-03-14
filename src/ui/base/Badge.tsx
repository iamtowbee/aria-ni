// src/ui/base/Badge.tsx
/**
 * Badge Component
 * 
 * Small status/count indicator with variants
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  count?: number;
  maxCount?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  count,
  maxCount = 99,
  style,
  textStyle,
}) => {
  const { colors, tokens } = useTheme();

  const getVariantColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success.main;
      case 'error':
        return colors.error.main;
      case 'warning':
        return colors.warning.main;
      case 'info':
        return colors.info.main;
      default:
        return colors.neutral[500];
    }
  };

  const getSizeStyles = () => {
    if (dot) {
      return {
        width: size === 'sm' ? 6 : size === 'lg' ? 10 : 8,
        height: size === 'sm' ? 6 : size === 'lg' ? 10 : 8,
        borderRadius: 999,
      };
    }

    return {
      minWidth: size === 'sm' ? 16 : size === 'lg' ? 24 : 20,
      height: size === 'sm' ? 16 : size === 'lg' ? 24 : 20,
      paddingHorizontal: size === 'sm' ? 4 : size === 'lg' ? 8 : 6,
      borderRadius: size === 'sm' ? 8 : size === 'lg' ? 12 : 10,
    };
  };

  const getFontSize = (): number => {
    return size === 'sm' 
      ? tokens.typography.fontSize.xs 
      : size === 'lg'
      ? tokens.typography.fontSize.sm
      : 11;
  };

  const displayCount = count !== undefined && count > maxCount 
    ? `${maxCount}+` 
    : count;

  if (dot) {
    return (
      <View
        style={[
          styles.badge,
          getSizeStyles(),
          { backgroundColor: getVariantColor() },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        getSizeStyles(),
        { backgroundColor: getVariantColor() },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: getFontSize(),
            color: colors.neutral[0],
          },
          textStyle,
        ]}
      >
        {count !== undefined ? displayCount : children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
