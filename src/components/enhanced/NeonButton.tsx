// src/components/enhanced/NeonButton.tsx
/**
 * Neon Glow Button
 * 
 * Cyberpunk-style button with animated glow
 * Like gaming UIs and futuristic terminals
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface NeonButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
  glowIntensity?: 'low' | 'medium' | 'high';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  color = '#3B82F6',
  size = 'md',
  variant = 'solid',
  icon,
  disabled = false,
  style,
  glowIntensity = 'medium',
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pulseAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pulseAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const sizes = {
    sm: { padding: 10, fontSize: 14, iconSize: 16 },
    md: { padding: 16, fontSize: 16, iconSize: 20 },
    lg: { padding: 20, fontSize: 18, iconSize: 24 },
  };

  const currentSize = sizes[size];

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: glowIntensity === 'low' ? [0.3, 0.5] : glowIntensity === 'high' ? [0.6, 0.9] : [0.4, 0.7],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const gradientColors = [color, color, color];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale: pulseAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {/* Glow Effect */}
        {variant !== 'ghost' && (
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: color,
                shadowColor: color,
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
        )}

        {/* Button Content */}
        {variant === 'solid' ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { padding: currentSize.padding }]}
          >
            <View style={styles.content}>
              {icon && <Text style={[styles.icon, { fontSize: currentSize.iconSize }]}>{icon}</Text>}
              <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>{title}</Text>
            </View>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.gradient,
              { 
                padding: currentSize.padding,
                borderWidth: variant === 'outline' ? 2 : 0,
                borderColor: color,
              },
            ]}
          >
            <View style={styles.content}>
              {icon && <Text style={[styles.icon, { fontSize: currentSize.iconSize, color }]}>{icon}</Text>}
              <Text style={[styles.text, { fontSize: currentSize.fontSize, color }]}>{title}</Text>
            </View>
          </View>
        )}

        {/* Scan Line Effect */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }),
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },

  button: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },

  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    zIndex: -1,
  },

  gradient: {
    borderRadius: 12,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  icon: {
    color: '#FFFFFF',
  },

  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
  },
});
