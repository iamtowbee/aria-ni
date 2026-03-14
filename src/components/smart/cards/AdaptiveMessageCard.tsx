// src/components/smart/cards/AdaptiveMessageCard.tsx
/**
 * Adaptive Message Card
 * 
 * Smart message display that adapts to content:
 * - Text with formatting
 * - Images with captions
 * - Code blocks with syntax highlighting
 * - Links with previews
 * - Agent-specific styling
 * - Swipe actions
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Image,
  Linking,
} from 'react-native';

export interface MessageContent {
  type: 'text' | 'image' | 'code' | 'link' | 'mixed';
  text?: string;
  imageUri?: string;
  code?: string;
  language?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface AdaptiveMessageCardProps {
  role: 'user' | 'assistant';
  content: MessageContent;
  agentName?: string;
  timestamp?: number;
  isTyping?: boolean;
  onLongPress?: () => void;
  onCopy?: (text: string) => void;
  onShare?: () => void;
  onRegenerate?: () => void;
}

/**
 * AdaptiveMessageCard
 * 
 * Intelligently displays messages with context-aware styling
 */
export const AdaptiveMessageCard: React.FC<AdaptiveMessageCardProps> = ({
  role,
  content,
  agentName = 'Aria',
  timestamp,
  isTyping = false,
  onLongPress,
  onCopy,
  onShare,
  onRegenerate,
}) => {
  const [showActions, setShowActions] = useState(false);
  const swipeX = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe actions
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => role === 'assistant',
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          swipeX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          setShowActions(true);
          Animated.spring(swipeX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setShowActions(false);
        }
      },
    })
  ).current;

  // Get agent color
  const getAgentColor = (): string => {
    const colors: Record<string, string> = {
      Vision: '#8B5CF6',
      OCR: '#3B82F6',
      Creativity: '#EC4899',
      Alpha: '#10B981',
      Beta: '#F59E0B',
      Gamma: '#6366F1',
      Delta: '#EF4444',
      Core: '#6B7280',
    };
    return colors[agentName] || '#6B7280';
  };

  // Render content based on type
  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return (
          <Text style={[
            styles.messageText,
            role === 'user' && styles.userText
          ]}>
            {content.text}
          </Text>
        );

      case 'image':
        return (
          <View>
            {content.imageUri && (
              <Image
                source={{ uri: content.imageUri }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
            {content.text && (
              <Text style={styles.caption}>{content.text}</Text>
            )}
          </View>
        );

      case 'code':
        return (
          <View style={styles.codeContainer}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeLanguage}>{content.language || 'code'}</Text>
              <TouchableOpacity onPress={() => onCopy?.(content.code || '')}>
                <Text style={styles.copyButton}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.codeText}>{content.code}</Text>
          </View>
        );

      case 'link':
        return (
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => content.url && Linking.openURL(content.url)}
          >
            <Text style={styles.linkText}>{content.text}</Text>
            <Text style={styles.linkUrl}>{content.url}</Text>
          </TouchableOpacity>
        );

      default:
        return <Text style={styles.messageText}>{content.text}</Text>;
    }
  };

  // Format timestamp
  const formatTime = (): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.messageRow,
        role === 'user' && styles.userRow,
      ]}>
        {/* Agent Avatar (for assistant) */}
        {role === 'assistant' && (
          <View style={[
            styles.avatar,
            { backgroundColor: getAgentColor() }
          ]}>
            <Text style={styles.avatarText}>
              {agentName.charAt(0)}
            </Text>
          </View>
        )}

        {/* Message Bubble */}
        <Animated.View
          {...(role === 'assistant' ? panResponder.panHandlers : {})}
          style={[
            styles.bubble,
            role === 'user' && styles.userBubble,
            role === 'assistant' && styles.assistantBubble,
            { transform: [{ translateX: swipeX }] },
          ]}
        >
          {/* Agent Name */}
          {role === 'assistant' && (
            <Text style={[styles.agentName, { color: getAgentColor() }]}>
              {agentName}
            </Text>
          )}

          {/* Content */}
          {isTyping ? (
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
          ) : (
            renderContent()
          )}

          {/* Timestamp */}
          {timestamp && (
            <Text style={styles.timestamp}>{formatTime()}</Text>
          )}
        </Animated.View>

        {/* Swipe Actions */}
        {showActions && role === 'assistant' && (
          <View style={styles.actions}>
            {onCopy && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onCopy(content.text || '')}
              >
                <Text style={styles.actionIcon}>📋</Text>
              </TouchableOpacity>
            )}
            {onRegenerate && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRegenerate}
              >
                <Text style={styles.actionIcon}>🔄</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  
  userRow: {
    justifyContent: 'flex-end',
  },
  
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  
  assistantBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  
  agentName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  
  userText: {
    color: '#fff',
  },
  
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  
  caption: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  
  codeContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2d2d2d',
  },
  
  codeLanguage: {
    fontSize: 12,
    color: '#888',
  },
  
  copyButton: {
    fontSize: 12,
    color: '#007AFF',
  },
  
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#d4d4d4',
    padding: 12,
  },
  
  linkContainer: {
    padding: 12,
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  
  linkText: {
    fontSize: 15,
    color: '#000',
    marginBottom: 4,
  },
  
  linkUrl: {
    fontSize: 13,
    color: '#007AFF',
  },
  
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  
  typingDot2: {
    opacity: 0.6,
  },
  
  typingDot3: {
    opacity: 0.3,
  },
  
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    marginHorizontal: 4,
  },
  
  actionIcon: {
    fontSize: 18,
  },
});
