// src/screens/OnboardingScreen.tsx
/**
 * Onboarding Flow
 * 
 * Multi-step introduction to the app:
 * - Welcome
 * - Choose your first agent
 * - Enable permissions
 * - Personalization
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  action?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Aria Nova',
    description: 'Your AI companion with multiple specialized agents to help you with anything.',
    emoji: '👋',
  },
  {
    id: 'agents',
    title: 'Meet Your AI Agents',
    description: 'Choose from 10 specialized agents - each one expert in different areas.',
    emoji: '🤖',
  },
  {
    id: 'voice',
    title: 'Talk Naturally',
    description: 'Use voice commands, type messages, or share images. We understand it all.',
    emoji: '🎤',
  },
  {
    id: 'offline',
    title: 'Works Offline',
    description: 'Continue chatting even without internet. Your conversations sync automatically.',
    emoji: '📴',
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Let\'s start your first conversation. Which agent would you like to meet first?',
    emoji: '🚀',
    action: 'Get Started',
  },
];

export interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { colors, tokens } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }

    // Animate transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(currentStep + 1);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      {!isLastStep && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: colors.text.secondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Emoji */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{step.emoji}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {step.title}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {step.description}
        </Text>
      </Animated.View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentStep
                  ? colors.primary
                  : colors.border.main,
                width: index === currentStep ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>
          {step.action || 'Next'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  
  emoji: {
    fontSize: 64,
  },
  
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  description: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: width * 0.8,
  },
  
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  
  dot: {
    height: 8,
    borderRadius: 4,
  },
  
  button: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
