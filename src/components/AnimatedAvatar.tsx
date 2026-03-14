// src/components/AnimatedAvatar.jsx
/**
 * Animated 3D-Style Avatar System
 * 
 * Features:
 * - Smooth emotion transitions
 * - Particle effects during processing
 * - Gesture animations (bounce, spin, pulse)
 * - Activity states (idle, thinking, speaking, listening)
 * - Customizable appearance
 * 
 * Uses Lottie for smooth animations + custom particle system
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

export const AnimatedAvatar = ({
  emotion = 'neutral',
  activity = 'idle',
  size = 120,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const [particles, setParticles] = useState([]);
  const particleTimerRef = useRef(null);

  // Emotion colors
  const emotionColors = {
    neutral: '#888888',
    happy: '#FFD700',
    sad: '#4169E1',
    angry: '#DC143C',
    anxious: '#9370DB',
    excited: '#FF69B4',
    tired: '#696969',
    curious: '#20B2AA',
    confused: '#DDA0DD',
    grateful: '#90EE90',
  };

  const currentColor = emotionColors[emotion] || emotionColors.neutral;

  // Activity animations
  useEffect(() => {
    switch (activity) {
      case 'thinking':
        startPulse();
        startParticles();
        break;
      case 'speaking':
        startBounce();
        break;
      case 'listening':
        startGlow();
        break;
      case 'processing':
        startSpin();
        startParticles();
        break;
      default:
        stopAllAnimations();
    }

    return () => {
      stopAllAnimations();
    };
  }, [activity]);

  // Emotion transition animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [emotion]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSpin = () => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const startGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const startParticles = () => {
    particleTimerRef.current = setInterval(() => {
      addParticle();
    }, 200);
  };

  const stopAllAnimations = () => {
    scaleAnim.stopAnimation();
    rotateAnim.stopAnimation();
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();
    
    if (particleTimerRef.current) {
      clearInterval(particleTimerRef.current);
      particleTimerRef.current = null;
    }
    
    setParticles([]);
    
    // Reset to defaults
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    pulseAnim.setValue(1);
    glowAnim.setValue(0);
  };

  const addParticle = () => {
    const id = Date.now() + Math.random();
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 60;
    
    const particle = {
      id,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0.5),
    };

    setParticles(prev => [...prev, particle]);

    // Animate particle
    Animated.parallel([
      Animated.timing(particle.opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(particle.scale, {
        toValue: 1.5,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove particle after animation
      setParticles(prev => prev.filter(p => p.id !== id));
    });
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: currentColor,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Particles */}
      {particles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
              backgroundColor: currentColor,
            },
          ]}
        />
      ))}

      {/* Main avatar */}
      <Animated.View
        style={[
          styles.avatar,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { rotate: rotation },
            ],
          },
        ]}
      >
        {/* Avatar circle with emotion color */}
        <View
          style={[
            styles.avatarCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: currentColor,
            },
          ]}
        >
          {/* Emoji based on emotion */}
          <View style={styles.emojiContainer}>
            {getEmotionEmoji(emotion, activity)}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// Get emoji for emotion + activity
function getEmotionEmoji(emotion, activity) {
  const emojis = {
    neutral: { idle: '😐', thinking: '🤔', speaking: '😊', listening: '👂' },
    happy: { idle: '😊', thinking: '😄', speaking: '😁', listening: '😃' },
    sad: { idle: '😔', thinking: '😢', speaking: '😞', listening: '😟' },
    angry: { idle: '😠', thinking: '😡', speaking: '😤', listening: '😾' },
    anxious: { idle: '😰', thinking: '😨', speaking: '😥', listening: '😬' },
    excited: { idle: '🤩', thinking: '😍', speaking: '🥳', listening: '🎉' },
    tired: { idle: '😴', thinking: '🥱', speaking: '😪', listening: '💤' },
    curious: { idle: '🤔', thinking: '🧐', speaking: '🤓', listening: '👀' },
    confused: { idle: '😕', thinking: '😵', speaking: '🤷', listening: '❓' },
    grateful: { idle: '🙏', thinking: '😌', speaking: '🤗', listening: '💚' },
  };

  const emotionSet = emojis[emotion] || emojis.neutral;
  const emoji = emotionSet[activity] || emotionSet.idle;

  return <View style={styles.emoji}><View>{emoji}</View></View>;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    borderRadius: 100,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
  },
});

/**
 * Usage:
 * 
 * <AnimatedAvatar
 *   emotion="happy"
 *   activity="thinking"
 *   size={120}
 * />
 */
