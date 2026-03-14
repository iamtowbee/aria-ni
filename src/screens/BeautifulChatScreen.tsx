// src/screens/BeautifulChatScreen.tsx
/**
 * Beautiful Enhanced Chat Screen
 * 
 * Uses glassmorphism, particles, neon effects
 * Terminal UI / Gaming aesthetic
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { useApp } from '../context/AppContext';
import { useConversation } from '../hooks/useConversation';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

// Enhanced Components
import { GlassCard } from '../components/enhanced/GlassCard';
import { ParticleBackground } from '../components/enhanced/ParticleBackground';
import { NeonButton } from '../components/enhanced/NeonButton';
import { HolographicText } from '../components/enhanced/HolographicText';

// UI Components
import { ChatBubble } from '../components/ui/ChatBubble';
import { AgentSelector } from '../components/ui/AgentSelector';
import { SuggestionChips } from '../components/ui/SuggestionChips';

export const BeautifulChatScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { state: appState, setActiveAgent } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const {
    messages,
    activeAgentId,
    isTyping,
    sendMessage,
    switchAgent,
    addReaction,
  } = useConversation();

  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useVoiceRecording();

  const [inputText, setInputText] = React.useState('');
  const [showAgentSelector, setShowAgentSelector] = React.useState(false);

  const currentAgent = appState.agents.find(a => a.id === activeAgentId) || appState.agents[0];

  useEffect(() => {
    // Animate header on mount
    Animated.spring(headerAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Particle Background */}
      <ParticleBackground particleCount={40} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Holographic Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [{
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                }],
              },
            ]}
          >
            <GlassCard
              borderGradient
              glowColor={currentAgent.color}
              style={styles.headerCard}
            >
              <View style={styles.headerContent}>
                {/* Agent Avatar with Glow */}
                <TouchableOpacity
                  onPress={() => setShowAgentSelector(!showAgentSelector)}
                  style={styles.avatarButton}
                >
                  <View style={[styles.avatarGlow, { backgroundColor: currentAgent.color }]} />
                  <View style={[styles.avatar, { backgroundColor: currentAgent.color }]}>
                    <Text style={styles.avatarEmoji}>{currentAgent.emoji}</Text>
                  </View>
                </TouchableOpacity>

                {/* Agent Info */}
                <View style={styles.headerInfo}>
                  <HolographicText size="md">
                    {currentAgent.name}
                  </HolographicText>
                  <Text style={[styles.specialty, { color: colors.text.secondary }]}>
                    {currentAgent.specialty}
                  </Text>
                </View>

                {/* Status Indicator */}
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    {
                      backgroundColor: isTyping ? '#F59E0B' : isRecording ? '#10B981' : '#3B82F6',
                    },
                  ]} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Agent Selector */}
          {showAgentSelector && (
            <View style={styles.selectorContainer}>
              <GlassCard borderGradient>
                <AgentSelector
                  agents={appState.agents}
                  activeAgent={activeAgentId}
                  onSelectAgent={(id) => {
                    switchAgent(id);
                    setActiveAgent(id);
                    setShowAgentSelector(false);
                  }}
                />
              </GlassCard>
            </View>
          )}

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(message => (
              <View key={message.id} style={styles.messageWrapper}>
                {!message.isUser && (
                  <GlassCard
                    style={styles.messageBubble}
                    borderGradient={false}
                    intensity={60}
                  >
                    <ChatBubble
                      text={message.text}
                      isUser={message.isUser}
                      agentName={currentAgent.name}
                      agentColor={currentAgent.color}
                      timestamp={message.timestamp}
                      reactions={message.reactions}
                      onReaction={(emoji) => addReaction(message.id, emoji)}
                      showAvatar={false}
                    />
                  </GlassCard>
                )}
                {message.isUser && (
                  <ChatBubble
                    text={message.text}
                    isUser={message.isUser}
                    agentName={currentAgent.name}
                    agentColor={currentAgent.color}
                    timestamp={message.timestamp}
                  />
                )}
              </View>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <GlassCard style={styles.messageBubble} intensity={60}>
                <ChatBubble
                  text=""
                  isUser={false}
                  agentName={currentAgent.name}
                  agentColor={currentAgent.color}
                  isTyping={true}
                  showAvatar={false}
                />
              </GlassCard>
            )}
          </ScrollView>

          {/* Suggestions */}
          {messages.length === 0 && (
            <View style={styles.suggestionsContainer}>
              <SuggestionChips
                suggestions={[
                  { id: '1', text: 'Tell me a story', icon: '📖' },
                  { id: '2', text: 'Analyze image', icon: '🖼️' },
                  { id: '3', text: 'Help me code', icon: '💻' },
                ]}
                onSuggestionPress={(s) => handleSendMessage(s.text)}
              />
            </View>
          )}

          {/* Input Area */}
          <GlassCard
            borderGradient
            glowColor={currentAgent.color}
            style={styles.inputCard}
          >
            <View style={styles.inputContainer}>
              {/* Text Input */}
              <View style={styles.textInputWrapper}>
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, { color: colors.text.primary }]}
                  placeholder={`Message ${currentAgent.name}...`}
                  placeholderTextColor={colors.text.tertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                  editable={!isRecording}
                />

                {/* Send Button */}
                {inputText.trim() && (
                  <NeonButton
                    title=""
                    icon="➤"
                    onPress={() => handleSendMessage(inputText)}
                    color={currentAgent.color}
                    size="sm"
                    variant="solid"
                    style={styles.sendButton}
                  />
                )}
              </View>

              {/* Voice Button */}
              {appState.voiceEnabled && (
                <NeonButton
                  title={isRecording ? 'Stop' : 'Voice'}
                  icon={isRecording ? '⏹' : '🎤'}
                  onPress={handleVoiceInput}
                  color={isRecording ? '#EF4444' : currentAgent.color}
                  size="md"
                  variant={isRecording ? 'solid' : 'outline'}
                  glowIntensity={isRecording ? 'high' : 'medium'}
                />
              )}
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  headerCard: {
    padding: 16,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarButton: {
    position: 'relative',
  },

  avatarGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    opacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  avatarEmoji: {
    fontSize: 28,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },

  specialty: {
    fontSize: 12,
    marginTop: 4,
  },

  statusContainer: {
    padding: 8,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },

  selectorContainer: {
    marginTop: 12,
    marginHorizontal: 16,
  },

  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  messagesContent: {
    paddingVertical: 16,
  },

  messageWrapper: {
    marginVertical: 4,
  },

  messageBubble: {
    marginVertical: 4,
  },

  suggestionsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },

  inputCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },

  inputContainer: {
    gap: 12,
  },

  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
  },

  sendButton: {
    width: 40,
    height: 40,
  },
});
