// src/ui/forms/Input.tsx
/**
 * Input Component
 * 
 * Standard text input with label and error states
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  disabled = false,
  ...textInputProps
}) => {
  const { colors, tokens } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: hasError
                ? colors.error
                : isFocused
                ? colors.primary
                : colors.text.secondary,
              fontSize: tokens.typography.fontSize.sm,
              marginBottom: tokens.spacing[1],
            },
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? colors.surfaceVariant : colors.surface,
            borderColor: hasError
              ? colors.error
              : isFocused
              ? colors.primary
              : colors.border.main,
            borderWidth: isFocused ? 2 : 1,
            borderRadius: tokens.radius.base,
            paddingHorizontal: tokens.spacing[3],
          },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text.primary,
              fontSize: tokens.typography.fontSize.base,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.text.tertiary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />

        {/* Right Icon */}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: hasError ? colors.error : colors.text.secondary,
              fontSize: tokens.typography.fontSize.xs,
              marginTop: tokens.spacing[1],
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  
  label: {
    fontWeight: '500',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  
  leftIcon: {
    marginRight: 8,
  },
  
  rightIcon: {
    marginLeft: 8,
  },
  
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  
  helperText: {
    fontWeight: '400',
  },
});
