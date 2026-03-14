// src/components/enhanced/ParticleBackground.tsx
/**
 * Animated Particle Background
 * 
 * Floating particles with depth and parallax effect
 * Like modern terminal UIs and sci-fi games
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../ui/theme/ThemeProvider';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  animX: Animated.Value;
  animY: Animated.Value;
}

export interface ParticleBackgroundProps {
  particleCount?: number;
  color?: string;
  gradient?: boolean;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 30,
  color,
  gradient = true,
}) => {
  const { colors, isDark } = useTheme();
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    // Initialize particles
    particles.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.1,
      animX: new Animated.Value(Math.random() * width),
      animY: new Animated.Value(Math.random() * height),
    }));

    // Animate particles
    particles.current.forEach((particle) => {
      const animateParticle = () => {
        Animated.parallel([
          Animated.timing(particle.animX, {
            toValue: Math.random() * width,
            duration: (Math.random() * 10000 + 10000) / particle.speed,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle.animY, {
            toValue: Math.random() * height,
            duration: (Math.random() * 8000 + 8000) / particle.speed,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => animateParticle());
      };

      animateParticle();
    });
  }, [particleCount]);

  const gradientColors = isDark
    ? ['rgba(10,10,30,1)', 'rgba(20,20,50,1)', 'rgba(10,10,30,1)']
    : ['rgba(240,240,255,1)', 'rgba(220,220,255,1)', 'rgba(240,240,255,1)'];

  const particleColor = color || (isDark ? 'rgba(100,150,255,0.3)' : 'rgba(100,100,200,0.2)');

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      {gradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      )}

      {/* Particles */}
      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              backgroundColor: particleColor,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.animX },
                { translateY: particle.animY },
              ],
            },
          ]}
        />
      ))}

      {/* Gradient Mesh Overlay */}
      <View style={styles.mesh}>
        <View style={[styles.meshBlob, styles.blob1, { backgroundColor: colors.primary }]} />
        <View style={[styles.meshBlob, styles.blob2, { backgroundColor: colors.secondary }]} />
        <View style={[styles.meshBlob, styles.blob3, { backgroundColor: colors.accent }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  mesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },

  meshBlob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.3,
  },

  blob1: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
  },

  blob2: {
    width: 500,
    height: 500,
    bottom: -150,
    left: -150,
  },

  blob3: {
    width: 300,
    height: 300,
    top: height / 2 - 150,
    left: width / 2 - 150,
  },
});
