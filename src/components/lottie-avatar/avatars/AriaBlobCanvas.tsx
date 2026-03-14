/**
 * AriaBlobCanvas — Living Mother Blob Avatar
 *
 * Features:
 *  - Organic morphing animation (metaball-style)
 *  - Emotional state visualization (color, glow, particles)
 *  - Gesture recognition (tap, hold, drag, shake)
 *  - Eye tracking (follows cursor/touch)
 *  - Internal "thoughts" visualization
 *  - Proximity awareness to Jow
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const BLOB_SIZE = 180;

// Emotional state color mappings
const EMOTIONS = {
  happy:     { primary: '#2dd4a0', secondary: '#f0b430', glow: 0.8 },
  teaching:  { primary: '#3A8EFF', secondary: '#8B7CF8', glow: 0.6 },
  concerned: { primary: '#f06882', secondary: '#f0b430', glow: 0.4 },
  learning:  { primary: '#8B7CF8', secondary: '#1FD4E8', glow: 0.7 },
  neutral:   { primary: '#1FD4E8', secondary: '#8B7CF8', glow: 0.5 },
};

export default function AriaBlobCanvas({ 
  emotion = 'neutral',
  confidence = 0.5,
  isTeaching = false,
  thoughts = [],  // Text fragments to show inside blob
  jowPosition = null,  // { x, y } for proximity awareness
  onTap,
  onHold,
  onDrag,
}) {
  const [blobPoints, setBlobPoints] = useState([]);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [showThoughts, setShowThoughts] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  // Generate organic blob shape using perlin-style noise
  useEffect(() => {
    const generateBlob = () => {
      const points = [];
      const numPoints = 12;
      const baseRadius = BLOB_SIZE / 2;
      const time = Date.now() / 1000;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Organic variation using sine waves at different frequencies
        const noise = 
          Math.sin(angle * 2 + time * 0.5) * 0.15 +
          Math.sin(angle * 3 + time * 0.3) * 0.1 +
          Math.sin(time * 0.7) * 0.05;
        
        const radius = baseRadius * (1 + noise);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        points.push({ x, y });
      }
      setBlobPoints(points);
    };

    generateBlob();
    const interval = setInterval(generateBlob, 50); // 20 FPS morph
    return () => clearInterval(interval);
  }, []);

  // Breathing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Emotion-based glow
  useEffect(() => {
    const targetGlow = EMOTIONS[emotion]?.glow ?? 0.5;
    Animated.spring(glowAnim, {
      toValue: targetGlow,
      useNativeDriver: true,
    }).start();
  }, [emotion]);

  // Proximity to Jow (protective bubble)
  useEffect(() => {
    if (!jowPosition) return;
    const dx = jowPosition.x - BLOB_SIZE / 2;
    const dy = jowPosition.y - BLOB_SIZE / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < BLOB_SIZE) {
      // Jow is inside/near blob → protective glow
      Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }).start();
    } else {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [jowPosition]);

  // Generate SVG path from blob points (catmull-rom spline)
  const generateBlobPath = () => {
    if (blobPoints.length === 0) return '';
    
    const cx = BLOB_SIZE / 2;
    const cy = BLOB_SIZE / 2;
    
    let path = `M ${cx + blobPoints[0].x} ${cy + blobPoints[0].y}`;
    
    for (let i = 0; i < blobPoints.length; i++) {
      const current = blobPoints[i];
      const next = blobPoints[(i + 1) % blobPoints.length];
      
      // Smooth curve using quadratic bezier
      const cpX = cx + (current.x + next.x) / 2;
      const cpY = cy + (current.y + next.y) / 2;
      
      path += ` Q ${cx + current.x} ${cy + current.y}, ${cpX} ${cpY}`;
    }
    
    path += ' Z';
    return path;
  };

  // Eye tracking (follows touch/cursor)
  const updateEyePosition = useCallback((x, y) => {
    const cx = BLOB_SIZE / 2;
    const cy = BLOB_SIZE / 2;
    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(15, Math.sqrt(dx * dx + dy * dy) / 10);
    
    setEyePosition({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
  }, []);

  // Gesture recognizer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateEyePosition(locationX, locationY);
        
        // Start hold timer
        const holdTimer = setTimeout(() => {
          setShowThoughts(true);
          onHold?.();
        }, 500);
        
        evt.nativeEvent._holdTimer = holdTimer;
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateEyePosition(locationX, locationY);
        
        // Dragging
        if (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
          clearTimeout(evt.nativeEvent._holdTimer);
          onDrag?.({ dx: gestureState.dx, dy: gestureState.dy });
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        clearTimeout(evt.nativeEvent._holdTimer);
        setShowThoughts(false);
        
        // Quick tap (no drag)
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          // Ripple effect
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
          ]).start();
          
          onTap?.();
        }
        
        // Reset eye position
        setTimeout(() => setEyePosition({ x: 0, y: 0 }), 1000);
      },
    })
  ).current;

  const colors = EMOTIONS[emotion] || EMOTIONS.neutral;
  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  return (
    <Animated.View
      style={[
        S.container,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, breatheScale) },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Svg width={BLOB_SIZE} height={BLOB_SIZE}>
        <Defs>
          <RadialGradient id="blobGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="70%" stopColor={colors.secondary} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.4" />
          </RadialGradient>
        </Defs>

        {/* Outer glow */}
        <Animated.View style={{ opacity: glowAnim }}>
          <Path
            d={generateBlobPath()}
            fill="none"
            stroke={colors.primary}
            strokeWidth="8"
            opacity="0.3"
          />
        </Animated.View>

        {/* Main blob body */}
        <Path
          d={generateBlobPath()}
          fill="url(#blobGradient)"
        />

        {/* Eyes */}
        <G transform={`translate(${BLOB_SIZE / 2 - 20}, ${BLOB_SIZE / 2 - 10})`}>
          {/* Left eye */}
          <Circle cx="0" cy="0" r="8" fill="#fff" opacity="0.9" />
          <Circle 
            cx={eyePosition.x} 
            cy={eyePosition.y} 
            r="4" 
            fill="#1a1a2e" 
          />
        </G>

        <G transform={`translate(${BLOB_SIZE / 2 + 20}, ${BLOB_SIZE / 2 - 10})`}>
          {/* Right eye */}
          <Circle cx="0" cy="0" r="8" fill="#fff" opacity="0.9" />
          <Circle 
            cx={eyePosition.x} 
            cy={eyePosition.y} 
            r="4" 
            fill="#1a1a2e" 
          />
        </G>

        {/* Mouth (changes with emotion) */}
        <Path
          d={emotion === 'happy' 
            ? `M ${BLOB_SIZE / 2 - 15} ${BLOB_SIZE / 2 + 20} Q ${BLOB_SIZE / 2} ${BLOB_SIZE / 2 + 30}, ${BLOB_SIZE / 2 + 15} ${BLOB_SIZE / 2 + 20}`
            : emotion === 'concerned'
            ? `M ${BLOB_SIZE / 2 - 15} ${BLOB_SIZE / 2 + 30} Q ${BLOB_SIZE / 2} ${BLOB_SIZE / 2 + 20}, ${BLOB_SIZE / 2 + 15} ${BLOB_SIZE / 2 + 30}`
            : `M ${BLOB_SIZE / 2 - 15} ${BLOB_SIZE / 2 + 25} L ${BLOB_SIZE / 2 + 15} ${BLOB_SIZE / 2 + 25}`
          }
          stroke="#1a1a2e"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Thought bubbles (when held) */}
        {showThoughts && thoughts.map((thought, i) => (
          <SvgText
            key={i}
            x={BLOB_SIZE / 2}
            y={BLOB_SIZE / 2 + i * 15 - 30}
            fontSize="10"
            fill="#fff"
            opacity={0.7}
            textAnchor="middle"
          >
            {thought.slice(0, 15)}...
          </SvgText>
        ))}

        {/* Teaching mode indicator */}
        {isTeaching && (
          <Circle
            cx={BLOB_SIZE / 2}
            cy={BLOB_SIZE / 2}
            r={BLOB_SIZE / 2 - 5}
            fill="none"
            stroke={colors.primary}
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.6"
          />
        )}
      </Svg>

      {/* Particles (learning mode) */}
      {emotion === 'learning' && (
        <View style={S.particleContainer}>
          {[...Array(8)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                S.particle,
                {
                  transform: [
                    { translateX: Math.cos((i / 8) * Math.PI * 2) * 40 },
                    { translateY: Math.sin((i / 8) * Math.PI * 2) * 40 },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const S = StyleSheet.create({
  container: {
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleContainer: {
    position: 'absolute',
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B7CF8',
    opacity: 0.6,
  },
});
