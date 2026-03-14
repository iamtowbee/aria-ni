// src/components/enhanced/HolographicSphere.tsx
/**
 * Holographic 3D Sphere
 * 
 * Sci-fi 3D sphere with:
 * - Rotating wireframe
 * - Holographic projection lines
 * - Particle field
 * - Depth and parallax
 * - Audio reactive (optional)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

export interface HolographicSphereProps {
  size?: number;
  color?: string;
  accentColor?: string;
  rotationSpeed?: number;
  pulseSpeed?: number;
  showParticles?: boolean;
  showGrid?: boolean;
  reactive?: boolean;
}

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const HolographicSphere: React.FC<HolographicSphereProps> = ({
  size = 200,
  color = '#00FFFF',
  accentColor = '#FF00FF',
  rotationSpeed = 8000,
  pulseSpeed = 2000,
  showParticles = true,
  showGrid = true,
  reactive = false,
}) => {
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const particleAnims = useRef([...Array(20)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // X-axis rotation
    Animated.loop(
      Animated.timing(rotateX, {
        toValue: 1,
        duration: rotationSpeed,
        useNativeDriver: true,
      })
    ).start();

    // Y-axis rotation
    Animated.loop(
      Animated.timing(rotateY, {
        toValue: 1,
        duration: rotationSpeed * 1.5,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    if (reactive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: pulseSpeed,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: pulseSpeed,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Particle animations
    if (showParticles) {
      particleAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000,
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
    }
  }, [reactive, showParticles]);

  const center = size / 2;
  const radius = size * 0.4;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow background */}
      <View
        style={[
          styles.glowBackground,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            backgroundColor: color,
            opacity: 0.1,
          },
        ]}
      />

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="sphereGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="50%" stopColor={accentColor} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>

        {/* Main sphere */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#sphereGradient)"
          strokeWidth={2}
          opacity={0.6}
        />

        {/* Wireframe grid */}
        {showGrid && (
          <G>
            {/* Horizontal lines (latitude) */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = center - radius + (i * radius * 2) / 4;
              const ellipseRy = Math.sqrt(
                Math.max(0, radius * radius - Math.pow(y - center, 2))
              );
              
              return (
                <AnimatedEllipse
                  key={`lat-${i}`}
                  cx={center}
                  cy={y}
                  rx={ellipseRy}
                  ry={ellipseRy * 0.3}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.4}
                />
              );
            })}

            {/* Vertical lines (longitude) */}
            {[0, 1, 2, 3].map((i) => {
              const angle = (i / 4) * Math.PI;
              const rx = radius * Math.abs(Math.cos(angle));
              
              return (
                <AnimatedEllipse
                  key={`lon-${i}`}
                  cx={center}
                  cy={center}
                  rx={rx}
                  ry={radius}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={1}
                  opacity={0.3}
                />
              );
            })}
          </G>
        )}

        {/* Holographic projection lines */}
        <G opacity={0.3}>
          {[0, 45, 90, 135].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x2 = center + Math.cos(rad) * radius * 1.5;
            const y2 = center + Math.sin(rad) * radius * 1.5;
            
            return (
              <Line
                key={`proj-${angle}`}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            );
          })}
        </G>

        {/* Orbiting particles */}
        {showParticles && particleAnims.map((anim, index) => {
          const angle = (index / 20) * Math.PI * 2;
          const orbitRadius = radius * 1.3;
          const x = center + Math.cos(angle) * orbitRadius;
          const y = center + Math.sin(angle) * orbitRadius;
          
          return (
            <AnimatedCircle
              key={`particle-${index}`}
              cx={x}
              cy={y}
              r={3}
              fill={index % 2 === 0 ? color : accentColor}
              opacity={anim}
            />
          );
        })}

        {/* Core glow */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.3}
          fill={color}
          opacity={0.2}
        />

        {/* Inner rings */}
        {[0.5, 0.7, 0.9].map((scale) => (
          <Circle
            key={`ring-${scale}`}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.2}
          />
        ))}
      </Svg>

      {/* Scan effect */}
      <Animated.View
        style={[
          styles.scanEffect,
          {
            width: size,
            height: 2,
            backgroundColor: color,
            opacity: rotateY.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.6, 0.3],
            }),
            transform: [{
              translateY: rotateY.interpolate({
                inputRange: [0, 1],
                outputRange: [-size / 2, size / 2],
              }),
            }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  glowBackground: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },

  scanEffect: {
    position: 'absolute',
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
