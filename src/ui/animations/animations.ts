// src/ui/animations/animations.ts
/**
 * Animation Utilities
 * 
 * Reusable animation presets and helpers
 */

import { Animated, Easing } from 'react-native';

/**
 * Fade in animation
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide in from bottom
 */
export const slideInBottom = (
  animatedValue: Animated.Value,
  distance: number = 100,
  duration: number = 300
): Animated.CompositeAnimation => {
  animatedValue.setValue(distance);
  return Animated.spring(animatedValue, {
    toValue: 0,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

/**
 * Slide out to bottom
 */
export const slideOutBottom = (
  animatedValue: Animated.Value,
  distance: number = 100,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: distance,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Scale in animation
 */
export const scaleIn = (
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  animatedValue.setValue(0);
  return Animated.spring(animatedValue, {
    toValue: 1,
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  });
};

/**
 * Scale out animation
 */
export const scaleOut = (
  animatedValue: Animated.Value,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Bounce animation
 */
export const bounce = (
  animatedValue: Animated.Value,
  count: number = 1
): Animated.CompositeAnimation => {
  const animations = [];
  
  for (let i = 0; i < count; i++) {
    animations.push(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
  }
  
  return Animated.sequence(animations);
};

/**
 * Shake animation
 */
export const shake = (
  animatedValue: Animated.Value,
  intensity: number = 10
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Pulse animation (continuous)
 */
export const pulse = (
  animatedValue: Animated.Value,
  minScale: number = 0.95,
  maxScale: number = 1.05,
  duration: number = 1000
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Rotate animation (continuous)
 */
export const rotate = (
  animatedValue: Animated.Value,
  duration: number = 1000
): Animated.CompositeAnimation => {
  animatedValue.setValue(0);
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Wiggle animation
 */
export const wiggle = (
  animatedValue: Animated.Value,
  angle: number = 10
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: angle,
      duration: 100,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -angle,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 100,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Create interpolated rotation
 */
export const interpolateRotation = (animatedValue: Animated.Value) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

/**
 * Stagger animations
 */
export const stagger = (
  animations: Animated.CompositeAnimation[],
  delay: number = 100
): Animated.CompositeAnimation => {
  const staggered = animations.map((anim, index) => 
    Animated.sequence([
      Animated.delay(delay * index),
      anim,
    ])
  );

  return Animated.parallel(staggered);
};

/**
 * Sequential animations with delays
 */
export const sequence = (
  animations: Animated.CompositeAnimation[],
  delay: number = 0
): Animated.CompositeAnimation => {
  const withDelays = [];
  
  animations.forEach((anim, index) => {
    if (index > 0 && delay > 0) {
      withDelays.push(Animated.delay(delay));
    }
    withDelays.push(anim);
  });

  return Animated.sequence(withDelays);
};

/**
 * Create animated value with initial value
 */
export const createAnimatedValue = (initialValue: number = 0): Animated.Value => {
  return new Animated.Value(initialValue);
};

/**
 * Reset animated value
 */
export const resetAnimatedValue = (
  animatedValue: Animated.Value,
  value: number = 0
): void => {
  animatedValue.setValue(value);
};
