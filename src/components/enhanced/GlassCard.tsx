// src/components/enhanced/GlassCard.tsx
/**
 * Glassmorphic Card Component
 * 
 * Beautiful frosted glass effect with blur backdrop
 * Inspired by modern terminal UIs and gaming interfaces
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../ui/theme/ThemeProvider';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderGradient?: boolean;
  glowColor?: string;
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 80,
  borderGradient = true,
  glowColor,
  elevated = false,
}) => {
  const { colors, isDark } = useTheme();

  const gradientColors = isDark
    ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
    : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)'];

  const borderColors = glowColor
    ? [glowColor, 'transparent', glowColor]
    : ['rgba(59,130,246,0.5)', 'rgba(139,92,246,0.5)', 'rgba(236,72,153,0.5)'];

  return (
    <View style={[styles.container, elevated && styles.elevated, style]}>
      {/* Border Gradient Glow */}
      {borderGradient && (
        <LinearGradient
          colors={borderColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.borderGradient}
        />
      )}

      {/* Glass Background with Blur */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blur}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {children}
          </LinearGradient>
        </BlurView>
      ) : (
        // Android fallback
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, styles.blur]}
        >
          {children}
        </LinearGradient>
      )}

      {/* Glow Effect */}
      {glowColor && (
        <View
          style={[
            styles.glow,
            { backgroundColor: glowColor, shadowColor: glowColor },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },

  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },

  borderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },

  blur: {
    borderRadius: 24,
    overflow: 'hidden',
  },

  gradient: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(20px)',
  },

  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    opacity: 0.15,
    borderRadius: 100,
    zIndex: -1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
  },
});
