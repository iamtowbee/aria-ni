// src/design-system/components/Card.tsx
/**
 * Card Component - Modern Design System
 * 
 * Features:
 * - Glass morphism support
 * - Hover effects
 * - Press animations
 * - Elevation levels
 * - Customizable padding
 * - Border variants
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: keyof typeof spacing;
  borderRadius?: keyof typeof radius;
  onPress?: () => void;
  style?: ViewStyle;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  elevation = 'md',
  padding = '4',
  borderRadius = 'xl',
  onPress,
  style,
  interactive = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.neutral[0],
          ...getShadowStyle(elevation),
        };
      
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.neutral[200],
        };
      
      case 'filled':
        return {
          backgroundColor: colors.neutral[50],
        };
      
      case 'glass':
        return {
          backgroundColor: colors.glass.light,
          borderWidth: 1,
          borderColor: colors.neutral[200],
          backdropFilter: 'blur(10px)',
        };
      
      default:
        return {};
    }
  };

  const getShadowStyle = (level: string): ViewStyle => {
    const shadowMap = {
      none: {},
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 8,
      },
    };
    
    return shadowMap[level] || shadowMap.md;
  };

  const cardStyle: ViewStyle = {
    ...getVariantStyle(),
    padding: parseFloat(spacing[padding]),
    borderRadius: parseFloat(radius[borderRadius]),
  };

  if (onPress || interactive) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={style}
      >
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

// Card sub-components
export const CardHeader: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

export const CardBody: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.body, style]}>{children}</View>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);

const subStyles = StyleSheet.create({
  header: {
    marginBottom: parseFloat(spacing[3]),
  },
  
  body: {
    flex: 1,
  },
  
  footer: {
    marginTop: parseFloat(spacing[3]),
    flexDirection: 'row',
    alignItems: 'center',
    gap: parseFloat(spacing[2]),
  },
});

Object.assign(styles, subStyles);
