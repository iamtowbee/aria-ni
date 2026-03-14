// src/components/enhanced/FloatingActionMenu.tsx
/**
 * Floating Action Menu
 * 
 * Radial menu with smooth animations
 * Gaming/terminal UI inspired
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { GlassCard } from './GlassCard';

export interface FloatingAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

export interface FloatingActionMenuProps {
  actions: FloatingAction[];
  mainIcon?: string;
  mainColor?: string;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  actions,
  mainIcon = '+',
  mainColor = '#3B82F6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(actions.map(() => new Animated.Value(0))).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.parallel([
      // Rotate main button
      Animated.spring(rotateAnim, {
        toValue,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Animate action buttons
      Animated.stagger(
        50,
        scaleAnims.map(anim =>
          Animated.spring(anim, {
            toValue,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();

    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: FloatingAction) => {
    toggleMenu();
    setTimeout(() => action.onPress(), 300);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Calculate positions in a circle
  const getActionPosition = (index: number) => {
    const angle = (Math.PI * 2 * index) / actions.length - Math.PI / 2;
    const radius = 80;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      {actions.map((action, index) => {
        const position = getActionPosition(index);
        const scale = scaleAnims[index];

        return (
          <Animated.View
            key={action.id}
            style={[
              styles.actionButton,
              {
                transform: [
                  { translateX: scale.interpolate({ inputRange: [0, 1], outputRange: [0, position.x] }) },
                  { translateY: scale.interpolate({ inputRange: [0, 1], outputRange: [0, position.y] }) },
                  { scale },
                ],
              },
            ]}
          >
            <TouchableOpacity onPress={() => handleActionPress(action)}>
              <GlassCard
                glowColor={action.color}
                borderGradient
                style={[styles.actionCard, { borderColor: action.color }]}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </GlassCard>
            </TouchableOpacity>

            {/* Label */}
            {isOpen && (
              <Animated.View
                style={[
                  styles.labelContainer,
                  { opacity: scale },
                ]}
              >
                <Text style={styles.label}>{action.label}</Text>
              </Animated.View>
            )}
          </Animated.View>
        );
      })}

      {/* Main Button */}
      <TouchableOpacity onPress={toggleMenu} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.mainButton,
            {
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          <GlassCard
            glowColor={mainColor}
            borderGradient
            elevated
            style={[styles.mainCard, { borderColor: mainColor }]}
          >
            <Text style={styles.mainIcon}>{mainIcon}</Text>
          </GlassCard>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainButton: {
    position: 'absolute',
  },

  mainCard: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainIcon: {
    fontSize: 32,
    color: '#FFFFFF',
  },

  actionButton: {
    position: 'absolute',
  },

  actionCard: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionIcon: {
    fontSize: 24,
  },

  labelContainer: {
    position: 'absolute',
    top: -30,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },

  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
