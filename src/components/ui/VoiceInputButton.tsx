// src/components/ui/VoiceInputButton.tsx
/**
 * Voice Input Button
 * 
 * Inspired by Pi AI and ChatGPT voice mode
 * Features:
 * - Pulsing animation when recording
 * - Visual feedback
 * - Waveform visualization
 * - Hold-to-speak or tap-to-toggle modes
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { useTheme } from '../../ui/theme/ThemeProvider';

export type VoiceInputMode = 'hold' | 'toggle';

export interface VoiceInputButtonProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  mode?: VoiceInputMode;
  size?: number;
  showWaveform?: boolean;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  mode = 'toggle',
  size = 64,
  showWaveform = true,
  disabled = false,
}) => {
  const { colors, tokens } = useTheme();
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef([...Array(12)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
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

      // Ripple animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Waveform animation
      if (showWaveform) {
        waveAnims.forEach((anim, index) => {
          Animated.loop(
            Animated.sequence([
              Animated.delay(index * 50),
              Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          ).start();
        });
      }
    } else {
      pulseAnim.setValue(1);
      rippleAnim.setValue(0);
      waveAnims.forEach(anim => anim.setValue(0));
    }
  }, [isRecording]);

  const handlePressIn = () => {
    if (mode === 'hold' && !disabled) {
      onStartRecording();
    }
  };

  const handlePressOut = () => {
    if (mode === 'hold' && !disabled) {
      onStopRecording();
    }
  };

  const handlePress = () => {
    if (mode === 'toggle' && !disabled) {
      if (isRecording) {
        onStopRecording();
      } else {
        onStartRecording();
      }
    }
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <View style={styles.container}>
      {/* Waveform background */}
      {isRecording && showWaveform && (
        <View style={styles.waveformContainer}>
          {waveAnims.map((anim, index) => {
            const height = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [4, 32],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height,
                    backgroundColor: colors.primary,
                    opacity: 0.6,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Ripple effect */}
      {isRecording && (
        <Animated.View
          style={[
            styles.ripple,
            {
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              backgroundColor: colors.primary,
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
            },
          ]}
        />
      )}

      {/* Main button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.buttonInner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isRecording ? '#EF4444' : colors.primary,
              transform: [{ scale: pulseAnim }],
            },
            disabled && styles.disabled,
          ]}
        >
          <Text style={styles.icon}>
            {isRecording ? '⏹' : '🎤'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Status text */}
      <Text style={[
        styles.statusText,
        { color: isRecording ? '#EF4444' : colors.text.secondary },
      ]}>
        {isRecording ? 'Recording...' : mode === 'hold' ? 'Hold to speak' : 'Tap to speak'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  waveformContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 0,
  },
  
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  
  ripple: {
    position: 'absolute',
    zIndex: 1,
  },
  
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  icon: {
    fontSize: 28,
  },
  
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
});
