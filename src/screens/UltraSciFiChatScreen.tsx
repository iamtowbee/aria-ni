// src/screens/UltraSciFiChatScreen.tsx
/**
 * Ultra Sci-Fi Chat Screen
 * 
 * Combines all futuristic effects:
 * - Vortex voice orb
 * - 3D holographic sphere
 * - Particle backgrounds
 * - Glass morphism
 * - Neon effects
 * - Terminal aesthetics
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { TerminalStatusBar } from '../components/enhanced/TerminalStatusBar';
import { VortexVoiceOrb } from '../components/enhanced/VortexVoiceOrb';
import { HolographicSphere } from '../components/enhanced/HolographicSphere';

// UI Components
import { ChatBubble } from '../components/ui/ChatBubble';
import { AgentSelector } from '../components/ui/AgentSelector';

export const UltraSciFiChatScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { state: appState, setActiveAgent } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
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

  const [inputText, setInputText] = useState('');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showOrb, setShowOrb] = useState(true);

  const currentAgent = appState.agents.find(a => a.id === activeAgentId) || appState.agents[0];

  const getOrbState = (): 'idle' | 'listening' | 'thinking' | 'speaking' => {
    if (isRecording) return 'listening';
    if (isTyping) return 'thinking';
    if (messages.length > 0 && !messages[messages.length - 1].isUser) return 'speaking';
    return 'idle';
  };

  useEffect(() => {
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
      <ParticleBackground
        particleCount={50}
        color="rgba(59,130,246,0.4)"
      />

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
              {/* Holographic Agent Name */}
              <View style={styles.headerTop}>
                <HolographicText size="lg">
                  {currentAgent.name.toUpperCase()}
                </HolographicText>
                
                <TouchableOpacity
                  onPress={() => setShowOrb(!showOrb)}
                  style={styles.orbToggle}
                >
                  <Text style={styles.orbToggleText}>
                    {showOrb ? '3D' : 'ORB'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Terminal Status Bar */}
              <TerminalStatusBar
                status={getOrbState() === 'idle' ? 'online' : 'processing'}
                agentName={currentAgent.name}
                messageCount={messages.length}
                showScanLine
              />
            </GlassCard>
          </Animated.View>

          {/* Sci-Fi Voice Visualization */}
          <View style={styles.visualizationContainer}>
            <TouchableOpacity
              onPress={() => setShowAgentSelector(!showAgentSelector)}
              activeOpacity={0.9}
            >
              {showOrb ? (
                <VortexVoiceOrb
                  state={getOrbState()}
                  size={220}
                  primaryColor={currentAgent.color}
                  accentColor={currentAgent.color}
                  glowIntensity={0.9}
                />
              ) : (
                <HolographicSphere
                  size={220}
                  color={currentAgent.color}
                  accentColor="#8B5CF6"
                  reactive={isRecording || isTyping}
                  showParticles
                  showGrid
                />
              )}
            </TouchableOpacity>

            {/* State Label */}
            <GlassCard style={styles.stateLabel}>
              <Text style={[styles.stateText, { color: colors.text.primary }]}>
                {getOrbState().toUpperCase()}
              </Text>
            </GlassCard>
          </View>

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
                <GlassCard
                  style={styles.messageBubble}
                  borderGradient={!message.isUser}
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

          {/* Input Area */}
          <GlassCard
            borderGradient
            glowColor={currentAgent.color}
            style={styles.inputCard}
          >
            <View style={styles.inputContainer}>
              {/* Text Input Row */}
              <View style={styles.inputRow}>
                <View style={[
                  styles.textInputWrapper,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.text.primary }]}
                    placeholder={`Transmit to ${currentAgent.name}...`}
                    placeholderTextColor={colors.text.tertiary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={1000}
                    editable={!isRecording}
                  />
                </View>

                {/* Send Button */}
                <NeonButton
                  title=""
                  icon="➤"
                  onPress={() => handleSendMessage(inputText)}
                  color={currentAgent.color}
                  size="md"
                  variant="solid"
                  glowIntensity="high"
                  disabled={!inputText.trim()}
                />
              </View>

              {/* Voice Button */}
              <NeonButton
                title={isRecording ? 'RECEIVING' : 'VOICE COMMAND'}
                icon={isRecording ? '⏹' : '🎤'}
                onPress={handleVoiceInput}
                color={isRecording ? '#EF4444' : currentAgent.color}
                size="lg"
                variant="solid"
                glowIntensity={isRecording ? 'high' : 'medium'}
                style={styles.voiceButton}
              />
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

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  orbToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },

  orbToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  visualizationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  stateLabel: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },

  stateText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  selectorContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
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

  inputCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },

  inputContainer: {
    gap: 12,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },

  textInputWrapper: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  textInput: {
    fontSize: 16,
    maxHeight: 100,
  },

  voiceButton: {
    width: '100%',
  },
});
