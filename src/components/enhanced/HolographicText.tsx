// src/components/enhanced/HolographicText.tsx
/**
 * Holographic Text
 * 
 * Animated gradient text with shimmer effect
 * Like terminal headers and game titles
 */

import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

export interface HolographicTextProps {
  children: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: TextStyle;
  colors?: string[];
  animated?: boolean;
}

export const HolographicText: React.FC<HolographicTextProps> = ({
  children,
  size = 'md',
  style,
  colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
  animated = true,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [animated]);

  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const fontSize = sizes[size];

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, { fontSize }, style]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, { fontSize, opacity: 0 }, style]}>
          {children}
        </Text>
      </LinearGradient>

      {/* Shimmer overlay */}
      {animated && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      )}
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },

  gradient: {
    flex: 1,
  },

  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
