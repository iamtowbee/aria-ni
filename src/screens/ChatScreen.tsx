// src/screens/ChatScreen.jsx
// Main chat interface with streaming, emotion awareness, and avatar

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';

export default function ChatScreen({ ecosystem }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [avatarState, setAvatarState] = useState('idle');
  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subscribe to ecosystem events
    if (ecosystem?.interface) {
      const unsubscribe = ecosystem.interface._onStateChange = (payload) => {
        if (payload.type === 'avatar') {
          setAvatarState(payload.state.id);
        }
      };
    }

    // Welcome message
    setMessages([{
      role: 'assistant',
      text: "Hi! I'm Nova, your personal AI assistant running completely on your device. I can chat, create stories, remember things, and adapt to your emotions. How can I help you today?",
      timestamp: Date.now(),
      emotion: 'neutral',
    }]);

    return () => {
      // Cleanup
    };
  }, [ecosystem]);

  useEffect(() => {
    // Pulse animation when thinking
    if (avatarState === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [avatarState]);

  async function sendMessage() {
    if (!input.trim() || !ecosystem || sending) return;

    const userMessage = {
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    // Create placeholder for streaming response
    const assistantPlaceholder = {
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      streaming: true,
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      setStreaming(true);
      setStreamingText('');

      // Process with streaming
      const response = await ecosystem.processText(userMessage.text, {
        speak: false, // Set to true for TTS
        onStream: (chunk, fullText) => {
          setStreamingText(fullText);
        },
      });

      // Update emotion
      if (response.emotionResult) {
        setCurrentEmotion(response.emotionResult.emotion.id);
      }

      // Replace placeholder with final message
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          text: response.text,
          timestamp: Date.now(),
          emotion: response.emotionResult?.emotion.id || 'neutral',
          streaming: false,
        };
        return newMessages;
      });

      setStreamingText('');
    } catch (err) {
      console.error('Send error:', err);
      
      // Show error message
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'error',
          text: `Error: ${err.message}. Make sure the model is loaded.`,
          timestamp: Date.now(),
        };
        return newMessages;
      });
    } finally {
      setSending(false);
      setStreaming(false);
    }
  }

  function handleQuickAction(action) {
    setInput(action);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Animated.View
            style={[
              styles.avatar,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: getEmotionColor(currentEmotion),
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>
              {getEmotionEmoji(currentEmotion)}
            </Text>
          </Animated.View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Nova AI</Text>
            <Text style={styles.headerSubtitle}>
              {getAvatarStateText(avatarState)} • {currentEmotion}
            </Text>
          </View>
        </View>
        
        {/* Model Info */}
        {ecosystem && (
          <Text style={styles.headerInfo}>
            {ecosystem.getStatus().model.name} • Local
          </Text>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            streamingText={msg.streaming ? streamingText : null}
          />
        ))}
      </ScrollView>

      {/* Quick Actions */}
      {!sending && messages.length <= 1 && (
        <View style={styles.quickActions}>
          <QuickActionButton
            text="Tell me a story"
            onPress={() => handleQuickAction('Tell me a short story about a brave explorer')}
          />
          <QuickActionButton
            text="Help me brainstorm"
            onPress={() => handleQuickAction('Give me 5 creative ideas for a weekend project')}
          />
          <QuickActionButton
            text="Chat with me"
            onPress={() => handleQuickAction('How are you doing today?')}
          />
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          multiline
          maxLength={500}
          editable={!sending}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, streamingText }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const displayText = streamingText || message.text;

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
        isError && styles.messageBubbleError,
      ]}
    >
      <Text style={styles.messageText}>{displayText}</Text>
      
      {message.streaming && (
        <View style={styles.streamingIndicator}>
          <ActivityIndicator size="small" color="#6C63FF" />
        </View>
      )}
      
      {message.emotion && !message.streaming && (
        <View style={styles.emotionBadge}>
          <Text style={styles.emotionEmoji}>
            {getEmotionEmoji(message.emotion)}
          </Text>
        </View>
      )}
    </View>
  );
}

function QuickActionButton({ text, onPress }) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <Text style={styles.quickActionText}>{text}</Text>
    </TouchableOpacity>
  );
}

function getEmotionColor(emotion) {
  const colors = {
    neutral: '#9E9E9E',
    happy: '#FFD600',
    sad: '#5C6BC0',
    angry: '#E53935',
    anxious: '#FF7043',
    excited: '#AB47BC',
    tired: '#78909C',
    curious: '#26C6DA',
    confused: '#FFA726',
    grateful: '#66BB6A',
  };
  return colors[emotion] || colors.neutral;
}

function getEmotionEmoji(emotion) {
  const emojis = {
    neutral: '😐',
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    excited: '🎉',
    tired: '😴',
    curious: '🤔',
    confused: '😕',
    grateful: '🙏',
  };
  return emojis[emotion] || '😐';
}

function getAvatarStateText(state) {
  const states = {
    idle: 'Ready',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    processing: 'Processing',
    creative: 'Creating',
    error: 'Error',
  };
  return states[state] || 'Ready';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#16213E',
    borderBottomWidth: 2,
    borderBottomColor: '#6C63FF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerInfo: {
    fontSize: 11,
    color: '#6C63FF',
    textAlign: 'center',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    position: 'relative',
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C63FF',
  },
  messageBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#16213E',
  },
  messageBubbleError: {
    alignSelf: 'center',
    backgroundColor: '#E53935',
  },
  messageText: {
    fontSize: 16,
    color: '#EAEAEA',
    lineHeight: 22,
  },
  streamingIndicator: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  emotionBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionEmoji: {
    fontSize: 14,
  },
  quickActions: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  quickActionButton: {
    backgroundColor: '#16213E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  quickActionText: {
    color: '#EAEAEA',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#16213E',
    borderTopWidth: 2,
    borderTopColor: '#6C63FF',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    color: '#EAEAEA',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  sendButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginLeft: 10,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#555',
  },
  sendButtonText: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
