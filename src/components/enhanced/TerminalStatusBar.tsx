// src/components/enhanced/TerminalStatusBar.tsx
/**
 * Terminal Status Bar
 * 
 * Retro terminal-style status display
 * Shows system info with animated scan lines
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../ui/theme/ThemeProvider';

export interface TerminalStatusBarProps {
  status: 'online' | 'processing' | 'offline';
  agentName: string;
  messageCount?: number;
  showScanLine?: boolean;
}

export const TerminalStatusBar: React.FC<TerminalStatusBarProps> = ({
  status,
  agentName,
  messageCount = 0,
  showScanLine = true,
}) => {
  const { colors, isDark } = useTheme();
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scan line animation
    if (showScanLine) {
      Animated.loop(
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }

    // Blink cursor
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [showScanLine]);

  const statusColors = {
    online: '#10B981',
    processing: '#F59E0B',
    offline: '#EF4444',
  };

  const statusLabels = {
    online: 'READY',
    processing: 'PROCESSING',
    offline: 'OFFLINE',
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDark ? '#0a0a0a' : '#1a1a1a',
        borderColor: statusColors[status],
      },
    ]}>
      {/* Scan Line */}
      {showScanLine && (
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY: scanLineTranslateY }],
            },
          ]}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Left: Agent Info */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: statusColors[status] }]}>
            AGENT:
          </Text>
          <Text style={[styles.value, { color: '#00FF00' }]}>
            {agentName.toUpperCase()}
          </Text>
        </View>

        {/* Center: Status */}
        <View style={styles.section}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
          <Text style={[styles.value, { color: statusColors[status] }]}>
            {statusLabels[status]}
          </Text>
        </View>

        {/* Right: Message Count */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: '#00FF00' }]}>
            MSG:
          </Text>
          <Text style={[styles.value, { color: '#00FF00' }]}>
            {String(messageCount).padStart(3, '0')}
          </Text>
          <Animated.Text style={[styles.cursor, { opacity: blinkAnim }]}>
            █
          </Animated.Text>
        </View>
      </View>

      {/* Grid overlay */}
      <View style={styles.grid} pointerEvents="none">
        {[...Array(10)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.gridLine,
              {
                left: `${i * 10}%`,
                borderColor: 'rgba(0,255,0,0.05)',
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
    height: 48,
    borderWidth: 2,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },

  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,255,0,0.3)',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  label: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },

  value: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    textShadowColor: 'currentColor',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },

  cursor: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#00FF00',
  },

  grid: {
    ...StyleSheet.absoluteFillObject,
  },

  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
  },
});
