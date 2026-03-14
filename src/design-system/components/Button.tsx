// src/design-system/components/Button.tsx
/**
 * Button Component - Modern Design System
 * 
 * Features:
 * - Multiple variants (solid, outline, ghost, soft)
 * - Sizes (sm, md, lg)
 * - Loading states
 * - Icons support
 * - Haptic feedback
 * - Accessibility
 * - Glass morphism support
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, shadows, animations } from '../tokens';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost' | 'soft' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  color?: keyof typeof colors.accent | 'primary' | 'success' | 'error' | 'warning';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'solid',
  size = 'md',
  color = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onPress,
  haptic = true,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
  };

  // Get color value
  const getColor = () => {
    if (color === 'primary') return colors.primary[500];
    if (color === 'success') return colors.success;
    if (color === 'error') return colors.error;
    if (color === 'warning') return colors.warning;
    return colors.accent[color];
  };

  const buttonColor = getColor();

  // Size styles
  const sizeStyles = {
    sm: {
      height: 36,
      paddingHorizontal: spacing[3],
      borderRadius: radius.md,
    },
    md: {
      height: 44,
      paddingHorizontal: spacing[4],
      borderRadius: radius.lg,
    },
    lg: {
      height: 52,
      paddingHorizontal: spacing[6],
      borderRadius: radius.xl,
    },
  };

  // Text size
  const textSizes = {
    sm: typography.sizes.sm,
    md: typography.sizes.base,
    lg: typography.sizes.lg,
  };

  // Variant styles
  const getVariantStyle = (): ViewStyle => {
    const base = sizeStyles[size];

    switch (variant) {
      case 'solid':
        return {
          ...base,
          backgroundColor: disabled ? colors.neutral[300] : buttonColor,
        };
      
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? colors.neutral[300] : buttonColor,
        };
      
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      
      case 'soft':
        return {
          ...base,
          backgroundColor: disabled 
            ? colors.neutral[100]
            : `${buttonColor}20`, // 20% opacity
        };
      
      case 'glass':
        return {
          ...base,
          backgroundColor: colors.glass.light,
          borderWidth: 1,
          borderColor: colors.neutral[200],
          backdropFilter: 'blur(10px)',
        };
      
      default:
        return base;
    }
  };

  // Text color
  const getTextColor = (): string => {
    if (disabled) return colors.neutral[400];
    
    switch (variant) {
      case 'solid':
        return colors.neutral[0];
      case 'outline':
      case 'ghost':
      case 'soft':
        return buttonColor;
      case 'glass':
        return colors.neutral[900];
      default:
        return colors.neutral[900];
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        getVariantStyle(),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        variant === 'solid' && !disabled && styles.shadow,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'solid' ? colors.neutral[0] : buttonColor}
            size="small"
          />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: parseFloat(textSizes[size]),
                  fontWeight: typography.weights.semibold.toString(),
                },
                textStyle,
              ]}
            >
              {children}
            </Text>
            
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: parseFloat(spacing[2]),
  },
  
  text: {
    fontFamily: typography.fonts.sans,
    letterSpacing: parseFloat(typography.tracking.tight),
  },
  
  iconLeft: {
    marginRight: parseFloat(spacing[1]),
  },
  
  iconRight: {
    marginLeft: parseFloat(spacing[1]),
  },
  
  fullWidth: {
    width: '100%',
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
