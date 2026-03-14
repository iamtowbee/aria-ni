// src/screens/updated/ChatScreen.tsx
/**
 * Chat Screen - Using UI Library
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  useTheme,
  SmartMessageInput,
  AdaptiveMessageCard,
  SmartLoadingState,
} from '../../ui';

export const ChatScreen: React.FC = () => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant' as const,
      content: { type: 'text' as const, text: 'Hello! How can I help?' },
      agentName: 'Core',
      timestamp: Date.now(),
    },
  ]);
  const [thinking, setThinking] = useState(false);

  const handleSend = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user' as const,
      content: { type: 'text' as const, text },
      timestamp: Date.now(),
    }]);
    setThinking(true);
    setTimeout(() => setThinking(false), 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.messages}>
        {messages.map(msg => (
          <AdaptiveMessageCard key={msg.id} {...msg} />
        ))}
        <SmartLoadingState visible={thinking} style="pulse" />
      </ScrollView>
      <SmartMessageInput onSend={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { flex: 1, padding: 16 },
});
