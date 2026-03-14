// src/components/enhanced/VortexVoiceOrb.tsx
/**
 * Vortex Voice Orb
 * 
 * Futuristic sci-fi voice visualization with:
 * - Rotating vortex effect
 * - Particle rings
 * - Energy pulses
 * - 3D depth illusion
 * - Audio reactive animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VortexVoiceOrbProps {
  state: VoiceOrbState;
  size?: number;
  primaryColor?: string;
  accentColor?: string;
  glowIntensity?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const VortexVoiceOrb: React.FC<VortexVoiceOrbProps> = ({
  state = 'idle',
  size = 200,
  primaryColor = '#3B82F6',
  accentColor = '#8B5CF6',
  glowIntensity = 0.8,
}) => {
  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const energyAnim = useRef(new Animated.Value(0)).current;
  const vortexAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const particleAnims = useRef([...Array(12)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // State-based animations
    if (state === 'listening' || state === 'speaking') {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Energy wave animation
      Animated.loop(
        Animated.timing(energyAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      ).start();

      // Vortex spiral animation
      vortexAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });

      // Particle ring animation
      particleAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 50),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else if (state === 'thinking') {
      // Slower pulse for thinking
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Idle state
      pulseAnim.setValue(1);
      energyAnim.setValue(0);
    }
  }, [state]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const energyOpacity = energyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  const energyScale = energyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const stateColors = {
    idle: primaryColor,
    listening: '#10B981',
    thinking: '#F59E0B',
    speaking: '#EF4444',
  };

  const currentColor = stateColors[state];
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: currentColor,
            opacity: glowIntensity * 0.3,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Energy waves */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <Animated.View
            style={[
              styles.energyWave,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: currentColor,
                opacity: energyOpacity,
                transform: [{ scale: energyScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.energyWave,
              {
                width: size * 0.8,
                height: size * 0.8,
                borderRadius: size * 0.4,
                borderColor: accentColor,
                opacity: energyOpacity.interpolate({
                  inputRange: [0, 0.6],
                  outputRange: [0, 0.4],
                }),
                transform: [{
                  scale: energyScale.interpolate({
                    inputRange: [1, 1.5],
                    outputRange: [1, 1.3],
                  }),
                }],
              },
            ]}
          />
        </>
      )}

      {/* Main vortex SVG */}
      <Animated.View
        style={[
          styles.vortex,
          { transform: [{ rotate: rotation }, { scale: pulseAnim }] },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="vortexGradient">
              <Stop offset="0%" stopColor={currentColor} stopOpacity="1" />
              <Stop offset="50%" stopColor={accentColor} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={currentColor} stopOpacity="0.2" />
            </RadialGradient>
          </Defs>

          {/* Center core */}
          <Circle
            cx={center}
            cy={center}
            r={size * 0.15}
            fill="url(#vortexGradient)"
          />

          {/* Vortex spirals */}
          {vortexAnims.map((anim, index) => {
            const angle = (index / 8) * Math.PI * 2;
            const radius = size * 0.3;
            
            return (
              <AnimatedCircle
                key={`spiral-${index}`}
                cx={center + Math.cos(angle) * radius}
                cy={center + Math.sin(angle) * radius}
                r={size * 0.05}
                fill={currentColor}
                opacity={anim}
              />
            );
          })}

          {/* Particle rings */}
          {particleAnims.map((anim, index) => {
            const angle = (index / 12) * Math.PI * 2;
            const baseRadius = size * 0.4;
            
            return (
              <AnimatedCircle
                key={`particle-${index}`}
                cx={center}
                cy={center}
                r={baseRadius}
                fill="none"
                stroke={accentColor}
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                })}
              />
            );
          })}

          {/* Orbiting elements */}
          {[0, 1, 2].map((ring) => {
            const ringRadius = size * (0.25 + ring * 0.1);
            return (
              <Circle
                key={`ring-${ring}`}
                cx={center}
                cy={center}
                r={ringRadius}
                fill="none"
                stroke={ring % 2 === 0 ? currentColor : accentColor}
                strokeWidth={1}
                opacity={0.3}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Scan lines */}
      <View style={styles.scanLines}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.scanLine,
              {
                top: (i / 20) * size,
                opacity: 0.05,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  glow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },

  energyWave: {
    position: 'absolute',
    borderWidth: 2,
  },

  vortex: {
    position: 'absolute',
  },

  scanLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
});
