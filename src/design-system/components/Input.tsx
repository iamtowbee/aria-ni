// src/design-system/components/Input.tsx
/**
 * Input Component - Modern Design System
 * 
 * Features:
 * - Multiple variants
 * - Icons support (left & right)
 * - Floating labels
 * - Error states
 * - Character counter
 * - Clear button
 * - Password toggle
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { colors, typography, spacing, radius } from '../tokens';

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'outlined' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  maxLength?: number;
  showCounter?: boolean;
  clearable?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  helperText,
  error,
  variant = 'outlined',
  size = 'md',
  leftIcon,
  rightIcon,
  disabled = false,
  maxLength,
  showCounter = false,
  clearable = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [labelAnim] = useState(new Animated.Value(value ? 1 : 0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleClear = () => {
    onChangeText('');
  };

  // Size styles
  const sizeStyles = {
    sm: {
      height: 36,
      fontSize: parseFloat(typography.sizes.sm),
      paddingHorizontal: parseFloat(spacing[3]),
    },
    md: {
      height: 44,
      fontSize: parseFloat(typography.sizes.base),
      paddingHorizontal: parseFloat(spacing[4]),
    },
    lg: {
      height: 52,
      fontSize: parseFloat(typography.sizes.lg),
      paddingHorizontal: parseFloat(spacing[5]),
    },
  };

  // Variant styles
  const getVariantStyle = (): ViewStyle => {
    const borderColor = error 
      ? colors.error 
      : isFocused 
        ? colors.primary[500] 
        : colors.neutral[300];

    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 2,
          borderColor,
          borderRadius: parseFloat(radius.lg),
          backgroundColor: colors.neutral[0],
        };
      
      case 'filled':
        return {
          borderWidth: 0,
          borderRadius: parseFloat(radius.lg),
          backgroundColor: colors.neutral[100],
          borderBottomWidth: 2,
          borderBottomColor: borderColor,
        };
      
      case 'underlined':
        return {
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomColor: borderColor,
          borderRadius: 0,
          backgroundColor: 'transparent',
        };
      
      default:
        return {};
    }
  };

  const inputContainerHeight = multiline 
    ? sizeStyles[size].height * numberOfLines 
    : sizeStyles[size].height;

  return (
    <View style={[styles.container, style]}>
      {/* Floating Label */}
      {label && (
        <Animated.Text
          style={[
            styles.label,
            {
              top: labelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  inputContainerHeight / 2 - 8,
                  -10,
                ],
              }),
              fontSize: labelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  sizeStyles[size].fontSize,
                  parseFloat(typography.sizes.sm),
                ],
              }),
              color: error 
                ? colors.error 
                : isFocused 
                  ? colors.primary[500] 
                  : colors.neutral[600],
            },
          ]}
        >
          {label}
        </Animated.Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          getVariantStyle(),
          { height: inputContainerHeight },
          disabled && styles.disabled,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.iconLeft}>{leftIcon}</View>
        )}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={label ? '' : placeholder}
          placeholderTextColor={colors.neutral[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !showPassword}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            {
              fontSize: sizeStyles[size].fontSize,
              paddingHorizontal: leftIcon ? 0 : sizeStyles[size].paddingHorizontal,
            },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
        />

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {/* Clear Button */}
          {clearable && value.length > 0 && !disabled && (
            <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}

          {/* Password Toggle */}
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconButton}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          )}

          {/* Right Icon */}
          {rightIcon && (
            <View style={styles.iconRight}>{rightIcon}</View>
          )}
        </View>
      </View>

      {/* Helper/Error/Counter Row */}
      <View style={styles.bottomRow}>
        {/* Helper or Error Text */}
        {(helperText || error) && (
          <Text
            style={[
              styles.helperText,
              error && styles.errorText,
            ]}
          >
            {error || helperText}
          </Text>
        )}

        {/* Character Counter */}
        {showCounter && maxLength && (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: parseFloat(spacing[4]),
  },
  
  label: {
    position: 'absolute',
    left: parseFloat(spacing[4]),
    backgroundColor: colors.neutral[0],
    paddingHorizontal: parseFloat(spacing[1]),
    fontFamily: typography.fonts.sans,
    fontWeight: typography.weights.medium.toString(),
    zIndex: 1,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  input: {
    flex: 1,
    fontFamily: typography.fonts.sans,
    color: colors.neutral[900],
  },
  
  multilineInput: {
    paddingTop: parseFloat(spacing[2]),
    paddingBottom: parseFloat(spacing[2]),
    textAlignVertical: 'top',
  },
  
  iconLeft: {
    marginLeft: parseFloat(spacing[3]),
    marginRight: parseFloat(spacing[2]),
  },
  
  iconRight: {
    marginLeft: parseFloat(spacing[2]),
    marginRight: parseFloat(spacing[3]),
  },
  
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  iconButton: {
    padding: parseFloat(spacing[2]),
  },
  
  clearIcon: {
    fontSize: parseFloat(typography.sizes.lg),
    color: colors.neutral[400],
  },
  
  eyeIcon: {
    fontSize: parseFloat(typography.sizes.lg),
  },
  
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: parseFloat(spacing[1]),
    paddingHorizontal: parseFloat(spacing[1]),
  },
  
  helperText: {
    fontSize: parseFloat(typography.sizes.sm),
    color: colors.neutral[600],
  },
  
  errorText: {
    color: colors.error,
  },
  
  counter: {
    fontSize: parseFloat(typography.sizes.sm),
    color: colors.neutral[500],
  },
  
  disabled: {
    opacity: 0.5,
    backgroundColor: colors.neutral[100],
  },
});
