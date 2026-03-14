// src/components/smart/feedback/SmartLoadingState.tsx
/**
 * Smart Loading State
 * 
 * Context-aware loading indicators:
 * - Different styles for different contexts
 * - Estimated time remaining
 * - Cancellable operations
 * - Progress indicators
 * - Skeleton screens
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

export type LoadingStyle = 
  | 'spinner'
  | 'skeleton'
  | 'progress'
  | 'dots'
  | 'pulse';

export interface SmartLoadingStateProps {
  visible: boolean;
  style?: LoadingStyle;
  message?: string;
  progress?: number; // 0-100
  estimatedTime?: number; // seconds
  onCancel?: () => void;
  context?: 'agent' | 'vision' | 'network' | 'file';
}

/**
 * SmartLoadingState
 * 
 * Adaptive loading indicators based on context
 */
export const SmartLoadingState: React.FC<SmartLoadingStateProps> = ({
  visible,
  style = 'spinner',
  message,
  progress,
  estimatedTime,
  onCancel,
  context = 'agent',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && style === 'pulse') {
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
    }

    if (visible && style === 'dots') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, style]);

  if (!visible) return null;

  // Get context-specific message
  const getContextMessage = (): string => {
    if (message) return message;
    
    const messages: Record<string, string> = {
      agent: 'Thinking...',
      vision: 'Analyzing image...',
      network: 'Syncing...',
      file: 'Processing...',
    };
    
    return messages[context] || 'Loading...';
  };

  // Render spinner style
  const renderSpinner = () => (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.message}>{getContextMessage()}</Text>
      {estimatedTime && (
        <Text style={styles.estimate}>
          ~{estimatedTime}s remaining
        </Text>
      )}
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render skeleton style
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeleton, styles.skeletonLine1]} />
      <View style={[styles.skeleton, styles.skeletonLine2]} />
      <View style={[styles.skeleton, styles.skeletonLine3]} />
    </View>
  );

  // Render progress style
  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.message}>{getContextMessage()}</Text>
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${progress || 0}%` }
        ]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress || 0)}%</Text>
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render dots style
  const renderDots = () => {
    const dot1Opacity = dotsAnim.interpolate({
      inputRange: [0, 0.33, 1],
      outputRange: [0.3, 1, 0.3],
    });
    
    const dot2Opacity = dotsAnim.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [0.3, 0.3, 1, 0.3],
    });
    
    const dot3Opacity = dotsAnim.interpolate({
      inputRange: [0, 0.66, 1],
      outputRange: [0.3, 0.3, 1],
    });

    return (
      <View style={styles.dotsContainer}>
        <Text style={styles.message}>{getContextMessage()}</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    );
  };

  // Render pulse style
  const renderPulse = () => (
    <View style={styles.pulseContainer}>
      <Animated.View style={[
        styles.pulse,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <Text style={styles.pulseIcon}>🤖</Text>
      </Animated.View>
      <Text style={styles.message}>{getContextMessage()}</Text>
    </View>
  );

  // Render based on style
  const renderContent = () => {
    switch (style) {
      case 'skeleton':
        return renderSkeleton();
      case 'progress':
        return renderProgress();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  // Spinner
  spinnerContainer: {
    alignItems: 'center',
  },
  
  message: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  
  estimate: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  
  cancelButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  
  cancelText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // Skeleton
  skeletonContainer: {
    width: '100%',
  },
  
  skeleton: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  
  skeletonLine1: {
    width: '100%',
  },
  
  skeletonLine2: {
    width: '80%',
  },
  
  skeletonLine3: {
    width: '60%',
  },
  
  // Progress
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  
  progressText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  
  // Dots
  dotsContainer: {
    alignItems: 'center',
  },
  
  dots: {
    flexDirection: 'row',
    marginTop: 12,
  },
  
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginHorizontal: 4,
  },
  
  // Pulse
  pulseContainer: {
    alignItems: 'center',
  },
  
  pulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  pulseIcon: {
    fontSize: 32,
  },
});
