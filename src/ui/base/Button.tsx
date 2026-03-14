// src/ui/base/Button.tsx
/**
 * Button Component
 * 
 * Standard button with variants and sizes
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const { colors, tokens } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.border.light : colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? colors.border.light : colors.surface,
          borderWidth: 1,
          borderColor: colors.border.main,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? colors.border.light : colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? colors.border.light : colors.error,
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: tokens.spacing[2],
          paddingHorizontal: tokens.spacing[3],
          minHeight: 32,
        };
      case 'lg':
        return {
          paddingVertical: tokens.spacing[4],
          paddingHorizontal: tokens.spacing[6],
          minHeight: 56,
        };
      case 'md':
      default:
        return {
          paddingVertical: tokens.spacing[3],
          paddingHorizontal: tokens.spacing[4],
          minHeight: 44,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.text.disabled;
    
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.neutral[0];
      case 'outline':
        return colors.primary;
      case 'secondary':
      case 'ghost':
      default:
        return colors.text.primary;
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'sm':
        return tokens.typography.fontSize.sm;
      case 'lg':
        return tokens.typography.fontSize.lg;
      case 'md':
      default:
        return tokens.typography.fontSize.base;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getTextSize(),
                marginLeft: icon && iconPosition === 'left' ? tokens.spacing[2] : 0,
                marginRight: icon && iconPosition === 'right' ? tokens.spacing[2] : 0,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
