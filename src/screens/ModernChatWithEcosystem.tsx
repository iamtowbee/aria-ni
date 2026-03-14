// src/screens/ModernChatWithEcosystem.tsx
/**
 * Modern Chat Screen with Ecosystem Integration
 * 
 * Uses useEcosystem hook to connect to AI agents
 * All modern UI components working with real AI
 */

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { useEcosystem } from '../integration/EcosystemProvider';

// UI Components
import { AvatarCard } from '../components/ui/AvatarCard';
import { ChatBubble } from '../components/ui/ChatBubble';
import { VoiceInputButton } from '../components/ui/VoiceInputButton';
import { AgentSelector, Agent } from '../components/ui/AgentSelector';
import { SuggestionChips, Suggestion } from '../components/ui/SuggestionChips';

export const ModernChatWithEcosystem: React.FC = () => {
  const { colors } = useTheme();
  const {
    activeAgent,
    messages,
    isProcessing,
    sendMessage: sendToEcosystem,
    switchAgent,
    availableAgents,
  } = useEcosystem();

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  // Convert ecosystem agents to UI format
  const agentConfigs: Agent[] = availableAgents.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    emoji: agent.emoji,
    color: agent.color,
    specialty: agent.description,
  }));

  const currentAgent = agentConfigs.find(a => a.id === activeAgent) || agentConfigs[0];

  const suggestions: Suggestion[] = [
    { id: '1', text: 'Tell me a joke', icon: '😄' },
    { id: '2', text: 'Analyze an image', icon: '🖼️' },
    { id: '3', text: 'Write a story', icon: '📖' },
    { id: '4', text: 'Help me remember something', icon: '💾' },
  ];

  // Auto-scroll on new messages
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setInputText('');
    inputRef.current?.blur();

    // Send to ecosystem
    await sendToEcosystem(text);
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
    // In production: start actual voice recording
  };

  const handleVoiceStop = async () => {
    setIsRecording(false);
    // In production: transcribe and send
    // For now, simulate
    setTimeout(() => {
      sendMessage("Voice message: This is a simulated transcription");
    }, 500);
  };

  const handleSuggestion = (suggestion: Suggestion) => {
    sendMessage(suggestion.text);
  };

  const handleAgentSwitch = (agentId: string) => {
    switchAgent(agentId);
    setShowAgentSelector(false);
  };

  const getAvatarStatus = () => {
    if (isRecording) return 'listening';
    if (isProcessing) return 'thinking';
    return 'idle';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Avatar Header */}
        <View style={styles.header}>
          <AvatarCard
            agentName={currentAgent.name}
            mood="happy"
            status={getAvatarStatus()}
            onTap={() => setShowAgentSelector(!showAgentSelector)}
            avatarColor={currentAgent.color}
          />
        </View>

        {/* Agent Selector */}
        {showAgentSelector && (
          <AgentSelector
            agents={agentConfigs}
            activeAgent={activeAgent}
            onSelectAgent={handleAgentSwitch}
          />
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeTitle, { color: colors.text.primary }]}>
                Welcome to Aria Nova! 👋
              </Text>
              <Text style={[styles.welcomeText, { color: colors.text.secondary }]}>
                I'm {currentAgent.name}, your AI assistant.{'\n'}
                How can I help you today?
              </Text>
            </View>
          )}

          {messages.map(message => (
            <ChatBubble
              key={message.id}
              text={message.text}
              isUser={message.isUser}
              agentName={currentAgent.name}
              agentColor={currentAgent.color}
              timestamp={message.timestamp}
              reactions={message.reactions}
            />
          ))}

          {/* Typing indicator */}
          {isProcessing && (
            <ChatBubble
              text=""
              isUser={false}
              agentName={currentAgent.name}
              agentColor={currentAgent.color}
              isTyping={true}
            />
          )}
        </ScrollView>

        {/* Suggestions */}
        {messages.length === 0 && (
          <SuggestionChips
            suggestions={suggestions}
            onSuggestionPress={handleSuggestion}
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.inputRow}>
            {/* Text Input */}
            <View style={[
              styles.textInputContainer,
              { backgroundColor: colors.background },
            ]}>
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: colors.text.primary }]}
                placeholder="Type a message..."
                placeholderTextColor={colors.text.tertiary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage(inputText)}
                multiline
                maxLength={1000}
                editable={!isProcessing}
              />
              
              <TouchableOpacity
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isProcessing}
                style={[
                  styles.sendButton,
                  { 
                    backgroundColor: (inputText.trim() && !isProcessing) 
                      ? colors.primary 
                      : colors.border.main 
                  },
                ]}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Voice Input */}
          <View style={styles.voiceButtonContainer}>
            <VoiceInputButton
              isRecording={isRecording}
              onStartRecording={handleVoiceStart}
              onStopRecording={handleVoiceStop}
              mode="toggle"
              size={56}
              disabled={isProcessing}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  keyboardView: {
    flex: 1,
  },
  
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  
  welcomeContainer: {
    padding: 32,
    alignItems: 'center',
  },
  
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  
  messagesContainer: {
    flex: 1,
  },
  
  messagesContent: {
    paddingVertical: 16,
  },
  
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  
  inputRow: {
    marginBottom: 12,
  },
  
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  
  voiceButtonContainer: {
    alignItems: 'center',
  },
});
