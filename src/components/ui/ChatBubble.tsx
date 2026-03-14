// src/components/ui/ChatBubble.tsx
/**
 * Modern Chat Bubble
 * 
 * Inspired by Character.AI and Replika's messaging style
 * Features:
 * - Smooth animations
 * - Typing indicators
 * - Long-press actions
 * - Avatar integration
 * - Reaction support
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useTheme } from '../../ui/theme/ThemeProvider';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  agentName?: string;
  agentColor?: string;
  timestamp?: number;
  isTyping?: boolean;
  showAvatar?: boolean;
  onLongPress?: () => void;
  reactions?: string[];
  onReaction?: (emoji: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  text,
  isUser,
  agentName = 'Aria',
  agentColor,
  timestamp,
  isTyping = false,
  showAvatar = true,
  onLongPress,
  reactions = [],
  onReaction,
}) => {
  const { colors, tokens } = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Typing animation
    if (isTyping) {
      const createTypingAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: -8,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      Animated.parallel([
        createTypingAnimation(typingDot1, 0),
        createTypingAnimation(typingDot2, 150),
        createTypingAnimation(typingDot3, 300),
      ]).start();
    }
  }, [isTyping]);

  const formatTime = (): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleLongPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowReactions(!showReactions);
    onLongPress?.();
  };

  const handleReaction = (emoji: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowReactions(false);
    onReaction?.(emoji);
  };

  const quickReactions = ['❤️', '👍', '😂', '🤔', '👏'];

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.agentContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Avatar */}
      {!isUser && showAvatar && (
        <View style={[
          styles.avatar,
          { backgroundColor: agentColor || colors.primary },
        ]}>
          <Text style={styles.avatarText}>
            {agentName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.bubbleContainer}>
        {/* Agent Name */}
        {!isUser && agentName && (
          <Text style={[styles.agentName, { color: agentColor || colors.primary }]}>
            {agentName}
          </Text>
        )}

        {/* Bubble */}
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={handleLongPress}
          delayLongPress={200}
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.agentBubble,
            {
              backgroundColor: isUser ? colors.primary : colors.surface,
            },
          ]}
        >
          {isTyping ? (
            <View style={styles.typingContainer}>
              <Animated.View
                style={[
                  styles.typingDot,
                  { transform: [{ translateY: typingDot1 }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.typingDot,
                  { transform: [{ translateY: typingDot2 }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.typingDot,
                  { transform: [{ translateY: typingDot3 }] },
                ]}
              />
            </View>
          ) : (
            <Text
              style={[
                styles.text,
                { color: isUser ? '#FFFFFF' : colors.text.primary },
              ]}
            >
              {text}
            </Text>
          )}
        </TouchableOpacity>

        {/* Reactions */}
        {reactions.length > 0 && (
          <View style={styles.reactionsBar}>
            {reactions.map((emoji, index) => (
              <View key={index} style={styles.reactionBubble}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Reactions Picker */}
        {showReactions && (
          <View style={[
            styles.reactionPicker,
            { backgroundColor: colors.surface },
          ]}>
            {quickReactions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionOption}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timestamp */}
        {timestamp && !isTyping && (
          <Text style={[
            styles.timestamp,
            { color: colors.text.tertiary },
            isUser && styles.userTimestamp,
          ]}>
            {formatTime()}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  
  userContainer: {
    justifyContent: 'flex-end',
  },
  
  agentContainer: {
    justifyContent: 'flex-start',
  },
  
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  bubbleContainer: {
    maxWidth: '75%',
  },
  
  agentName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
  },
  
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  userBubble: {
    borderBottomRightRadius: 4,
  },
  
  agentBubble: {
    borderBottomLeftRadius: 4,
  },
  
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 3,
  },
  
  reactionsBar: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 12,
  },
  
  reactionBubble: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  
  reactionEmoji: {
    fontSize: 14,
  },
  
  reactionPicker: {
    flexDirection: 'row',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  reactionOption: {
    paddingHorizontal: 8,
  },
  
  reactionOptionEmoji: {
    fontSize: 24,
  },
  
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 12,
  },
  
  userTimestamp: {
    textAlign: 'right',
    marginRight: 12,
    marginLeft: 0,
  },
});
