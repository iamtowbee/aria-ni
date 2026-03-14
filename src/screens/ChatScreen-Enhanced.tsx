// src/screens/ChatScreen-Enhanced.jsx
/**
 * Enhanced ChatScreen with Original Aria UI
 * 
 * Features:
 * - Voice Orb (interactive audio visualization)
 * - Lottie 3D Avatar (real-time animation from JSON)
 * - Attention Map (shows AI focus)
 * - All integrated with Nova's multi-agent system
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Voice Orb components
import { useVoiceOrb } from '../components/voice-orb/useVoiceOrb';
import { VoiceOrb } from '../components/voice-orb/VoiceOrb';

// Lottie 3D Avatar components
import { AvatarCanvas } from '../components/lottie-avatar/AvatarCanvas';
import { AttentionMap } from '../components/lottie-avatar/AttentionMap';

export default function ChatScreenEnhanced({ ecosystem }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [attention, setAttention] = useState(null);
  const [showAttention, setShowAttention] = useState(false);
  
  const scrollRef = useRef(null);
  
  // Voice Orb hook
  const voiceOrb = useVoiceOrb({
    fftSize: 512,
    smoothing: 0.85,
  });

  // Get current emotion from ecosystem
  const currentEmotion = ecosystem?.delta?.currentEmotion?.id || 'neutral';
  const jowProgress = ecosystem?.jow?.getProgress?.() || { age: 0, skills: {} };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    voiceOrb.setThinking();

    try {
      let fullResponse = '';
      
      const response = await ecosystem.think(userMessage.content, {
        onStream: (token, currentText) => {
          fullResponse = currentText;
        },
      });

      const aiMessage = {
        role: 'assistant',
        content: response.text || fullResponse,
        timestamp: Date.now(),
        attention: response.attention,
        confidence: response.confidence,
        jow: response.jow,
      };

      setMessages(prev => [...prev, aiMessage]);
      setAttention(response.attention);

      // Speak if enabled
      if (ecosystem.config?.autoSpeak) {
        voiceOrb.setSpeaking();
        await ecosystem.speak(aiMessage.content);
        voiceOrb.setState('idle');
      }
    } catch (err) {
      console.error('[ChatScreen] Error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong.',
        timestamp: Date.now(),
        error: true,
      }]);
    } finally {
      setIsThinking(false);
      voiceOrb.setState('idle');
    }
  };

  const handleVoiceInput = async () => {
    if (voiceOrb.isRecording) {
      voiceOrb.stopListening();
      // Process transcript here if available
    } else {
      await voiceOrb.startListening();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header with Avatar and Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Lottie 3D Avatar */}
          <View style={styles.avatarContainer}>
            <AvatarCanvas
              emotion={currentEmotion}
              isThinking={isThinking}
              isSpeaking={voiceOrb.state === 'speaking'}
              style={styles.avatar}
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Aria-Nova</Text>
            <Text style={styles.headerStatus}>
              {voiceOrb.state === 'listening' && '🎤 Listening...'}
              {voiceOrb.state === 'thinking' && '🧠 Thinking...'}
              {voiceOrb.state === 'speaking' && '🗣️ Speaking...'}
              {voiceOrb.state === 'idle' && `😊 ${currentEmotion}`}
            </Text>
            {jowProgress.age > 0 && (
              <Text style={styles.jowInfo}>
                🦉 Jow: Age {jowProgress.age} | Learned from {jowProgress.age} turns
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.attentionButton}
            onPress={() => setShowAttention(!showAttention)}
          >
            <Text style={styles.attentionButtonText}>
              {showAttention ? '👁️' : '🧠'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Attention Map (collapsible) */}
        {showAttention && attention && (
          <View style={styles.attentionContainer}>
            <AttentionMap
              attention={attention}
              style={styles.attentionMap}
            />
          </View>
        )}
      </View>

      {/* Voice Orb (shows when active) */}
      {voiceOrb.state !== 'idle' && (
        <View style={styles.voiceOrbContainer}>
          <VoiceOrb
            audioData={voiceOrb.audioData}
            amplitude={voiceOrb.amplitude}
            state={voiceOrb.state}
            size={120}
          />
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={styles.messageText}>{msg.content}</Text>
            
            {msg.confidence !== undefined && (
              <Text style={styles.messageMetadata}>
                Confidence: {(msg.confidence * 100).toFixed(0)}%
              </Text>
            )}
            
            {msg.jow && msg.jow.age > 0 && (
              <Text style={styles.messageMetadata}>
                🦉 Jow observed (Age: {msg.jow.age})
              </Text>
            )}
          </View>
        ))}

        {isThinking && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <Text style={styles.thinkingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            voiceOrb.isRecording && styles.voiceButtonActive,
          ]}
          onPress={handleVoiceInput}
        >
          <Text style={styles.voiceButtonText}>
            {voiceOrb.isRecording ? '⏹️' : '🎤'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !input.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isThinking}
        >
          <Text style={styles.sendButtonText}>⬆️</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213E',
  },
  header: {
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 2,
    borderBottomColor: '#6C63FF',
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  headerStatus: {
    fontSize: 14,
    color: '#6C63FF',
    marginTop: 2,
  },
  jowInfo: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  attentionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attentionButtonText: {
    fontSize: 20,
  },
  attentionContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#6C63FF',
  },
  attentionMap: {
    height: 100,
  },
  voiceOrbContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C63FF',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  messageText: {
    fontSize: 16,
    color: '#EAEAEA',
  },
  messageMetadata: {
    fontSize: 11,
    color: '#888',
    marginTop: 5,
  },
  thinkingText: {
    fontSize: 16,
    color: '#6C63FF',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#1A1A2E',
    borderTopWidth: 1,
    borderTopColor: '#6C63FF',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  voiceButtonActive: {
    backgroundColor: '#E53935',
  },
  voiceButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#16213E',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#EAEAEA',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
  },
  sendButtonText: {
    fontSize: 20,
  },
});
