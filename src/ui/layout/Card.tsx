// src/ui/layout/Card.tsx
/**
 * Card Component
 * 
 * Standard card container with shadows and variants
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  shadow?: 'none' | 'sm' | 'base' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  style,
  padding,
  shadow = 'base',
}) => {
  const { colors, tokens } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          ...tokens.shadows[shadow],
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border.main,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceVariant,
        };
      default:
        return {};
    }
  };

  const cardContent = (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        {
          borderRadius: tokens.radius.md,
          padding: padding !== undefined ? padding : tokens.spacing[4],
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
