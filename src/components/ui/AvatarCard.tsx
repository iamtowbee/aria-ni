// src/components/ui/AvatarCard.tsx
/**
 * Avatar Card Component
 * 
 * Inspired by Replika, Character.AI, and Pi
 * Features:
 * - Animated avatar display
 * - Status indicators (thinking, listening, speaking)
 * - Mood visualization
 * - Interaction hints
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../ui/theme/ThemeProvider';

const { width } = Dimensions.get('window');

export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'excited' | 'empathetic';
export type AvatarStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AvatarCardProps {
  agentName: string;
  mood?: AvatarMood;
  status?: AvatarStatus;
  onTap?: () => void;
  showHint?: boolean;
  avatarColor?: string;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  agentName,
  mood = 'neutral',
  status = 'idle',
  onTap,
  showHint = true,
  avatarColor,
}) => {
  const { colors, tokens } = useTheme();
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Status-based animations
    if (status === 'thinking' || status === 'speaking') {
      // Pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }

    // Floating animation (always active)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [status]);

  const getMoodEmoji = (): string => {
    const moods = {
      neutral: '😊',
      happy: '😄',
      thinking: '🤔',
      excited: '🤩',
      empathetic: '💙',
    };
    return moods[mood];
  };

  const getStatusText = (): string => {
    const statuses = {
      idle: 'Tap to start',
      listening: 'Listening...',
      thinking: 'Thinking...',
      speaking: 'Speaking...',
    };
    return statuses[status];
  };

  const getStatusColor = (): string => {
    const statusColors = {
      idle: colors.text.tertiary,
      listening: '#10B981',
      thinking: '#F59E0B',
      speaking: '#3B82F6',
    };
    return statusColors[status];
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.4)'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onTap}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Avatar Circle with Glow */}
        <Animated.View style={[styles.glowContainer, { backgroundColor: glowColor }]}>
          <Animated.View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: avatarColor || colors.primary,
                transform: [
                  { scale: pulseAnim },
                  { translateY: floatAnim },
                ],
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>{getMoodEmoji()}</Text>
            
            {/* Orbiting particles (status indicator) */}
            {(status === 'thinking' || status === 'listening') && (
              <View style={styles.particles}>
                <View style={[styles.particle, { backgroundColor: getStatusColor() }]} />
                <View style={[styles.particle, styles.particle2, { backgroundColor: getStatusColor() }]} />
                <View style={[styles.particle, styles.particle3, { backgroundColor: getStatusColor() }]} />
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Agent Info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text.primary }]}>
            {agentName}
          </Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.status, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Hint */}
        {showHint && status === 'idle' && (
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            👆 Tap to interact
          </Text>
        )}
      </View>

      {/* Waveform (when speaking) */}
      {status === 'speaking' && (
        <View style={styles.waveform}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.wave,
                {
                  backgroundColor: colors.primary,
                  opacity: 0.3 + (i % 3) * 0.2,
                },
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  
  content: {
    alignItems: 'center',
  },
  
  glowContainer: {
    borderRadius: 100,
    padding: 8,
  },
  
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  avatarEmoji: {
    fontSize: 64,
  },
  
  particles: {
    position: 'absolute',
    width: 180,
    height: 180,
  },
  
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
    left: '50%',
  },
  
  particle2: {
    top: '50%',
    left: 0,
  },
  
  particle3: {
    bottom: 0,
    left: '50%',
  },
  
  info: {
    alignItems: 'center',
    marginTop: 24,
  },
  
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  
  status: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  hint: {
    fontSize: 14,
    marginTop: 12,
  },
  
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginTop: 24,
    gap: 4,
  },
  
  wave: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
});
