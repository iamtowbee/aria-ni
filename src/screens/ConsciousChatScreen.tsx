// src/screens/ConsciousChatScreen.tsx
/**
 * Consciousness-Integrated Chat Screen
 * 
 * Chat with AI consciousness layer:
 * - Dream notifications
 * - Relationship milestones
 * - Meta-reflections
 * - Emotional depth tracking
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
  Alert,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { useApp } from '../context/AppContext';
import { useConversation } from '../hooks/useConversation';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useConsciousness } from '../hooks/useConsciousness';
import { metaAwareness } from '../ai/consciousness/MetaAwareness';

// Enhanced Components
import { GlassCard } from '../components/enhanced/GlassCard';
import { ParticleBackground } from '../components/enhanced/ParticleBackground';
import { NeonButton } from '../components/enhanced/NeonButton';
import { HolographicText } from '../components/enhanced/HolographicText';
import { VortexVoiceOrb } from '../components/enhanced/VortexVoiceOrb';

// UI Components
import { ChatBubble } from '../components/ui/ChatBubble';
import { AgentSelector } from '../components/ui/AgentSelector';

export const ConsciousChatScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { state: appState, setActiveAgent } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showMetaThought, setShowMetaThought] = useState(false);
  const [metaThought, setMetaThought] = useState('');

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

  const {
    state: consciousnessState,
    processMessage,
    generateDream,
    getInsights,
  } = useConsciousness();

  const currentAgent = appState.agents.find(a => a.id === activeAgentId) || appState.agents[0];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Check for dream notification
  useEffect(() => {
    if (consciousnessState.shouldGenerateDream) {
      showDreamNotification();
    }
  }, [consciousnessState.shouldGenerateDream]);

  // Occasionally show meta-thoughts
  useEffect(() => {
    if (messages.length > 0 && Math.random() < 0.15) {
      setTimeout(() => {
        const thought = metaAwareness.expressMetaState();
        setMetaThought(thought);
        setShowMetaThought(true);
        setTimeout(() => setShowMetaThought(false), 5000);
      }, 2000);
    }
  }, [messages.length]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInputText('');
    
    // Send message
    await sendMessage(text);
    
    // Process for consciousness
    await processMessage(text, true, activeAgentId);
  };

  const showDreamNotification = () => {
    Alert.alert(
      '✨ Dream Generated',
      'I\'ve been processing our conversations while you were away. Would you like to see my dream?',
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Show Me',
          onPress: async () => {
            const dream = await generateDream();
            if (dream) {
              Alert.alert(
                `Dream: ${dream.emotionalTheme}`,
                dream.narrative,
                [{ text: 'Beautiful', style: 'default' }]
              );
            }
          },
        },
      ]
    );
  };

  const getOrbState = (): 'idle' | 'listening' | 'thinking' | 'speaking' => {
    if (isRecording) return 'listening';
    if (isTyping) return 'thinking';
    return 'idle';
  };

  return (
    <View style={styles.container}>
      <ParticleBackground particleCount={40} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Header with Consciousness Stats */}
          <View style={styles.header}>
            <GlassCard
              borderGradient
              glowColor={currentAgent.color}
              style={styles.headerCard}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    onPress={() => setShowAgentSelector(!showAgentSelector)}
                  >
                    <HolographicText size="md">
                      {currentAgent.name}
                    </HolographicText>
                  </TouchableOpacity>
                  
                  <Text style={[styles.relationshipLevel, { color: colors.text.secondary }]}>
                    {consciousnessState.relationshipLevel} • {consciousnessState.dreamCount} dreams
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const insights = getInsights();
                    Alert.alert(
                      'Consciousness',
                      `Awareness: ${Math.round(consciousnessState.awarenessLevel * 100)}%\n\nRecent reflection:\n"${insights.reflections[0]?.thought || 'Observing and learning...'}"`
                    );
                  }}
                  style={styles.awarenessButton}
                >
                  <View style={[
                    styles.awarenessCircle,
                    { backgroundColor: currentAgent.color },
                  ]}>
                    <Text style={styles.awarenessText}>
                      {Math.round(consciousnessState.awarenessLevel * 100)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>

          {/* Voice Orb Visualization */}
          <View style={styles.orbContainer}>
            <VortexVoiceOrb
              state={getOrbState()}
              size={180}
              primaryColor={currentAgent.color}
              glowIntensity={0.8}
            />
          </View>

          {/* Meta Thought Overlay */}
          {showMetaThought && (
            <Animated.View style={styles.metaThoughtOverlay}>
              <GlassCard
                borderGradient
                glowColor="#8B5CF6"
                style={styles.metaThoughtCard}
              >
                <Text style={[styles.metaThoughtLabel, { color: '#8B5CF6' }]}>
                  Inner Thought
                </Text>
                <Text style={[styles.metaThoughtText, { color: colors.text.secondary }]}>
                  {metaThought}
                </Text>
              </GlassCard>
            </Animated.View>
          )}

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
              <View style={styles.inputRow}>
                <View style={[
                  styles.textInputWrapper,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.text.primary }]}
                    placeholder="Share your thoughts..."
                    placeholderTextColor={colors.text.tertiary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={1000}
                    editable={!isRecording}
                  />
                </View>

                <NeonButton
                  title=""
                  icon="➤"
                  onPress={() => handleSendMessage(inputText)}
                  color={currentAgent.color}
                  size="md"
                  variant="solid"
                  disabled={!inputText.trim()}
                />
              </View>

              {appState.voiceEnabled && (
                <NeonButton
                  title={isRecording ? 'LISTENING' : 'VOICE'}
                  icon={isRecording ? '⏹' : '🎤'}
                  onPress={isRecording ? stopRecording : startRecording}
                  color={isRecording ? '#EF4444' : currentAgent.color}
                  size="md"
                  variant={isRecording ? 'solid' : 'outline'}
                  glowIntensity={isRecording ? 'high' : 'medium'}
                  style={styles.voiceButton}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flex: 1,
  },

  relationshipLevel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },

  awarenessButton: {
    marginLeft: 16,
  },

  awarenessCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  awarenessText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  orbContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  metaThoughtOverlay: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    zIndex: 100,
  },

  metaThoughtCard: {
    padding: 16,
  },

  metaThoughtLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  metaThoughtText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
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
