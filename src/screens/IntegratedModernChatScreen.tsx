// src/screens/IntegratedModernChatScreen.tsx
/**
 * Fully Integrated Modern Chat Screen
 * 
 * Uses all hooks and connects to real agents
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
  Alert,
} from 'react-native';
import { useTheme } from '../ui/theme/ThemeProvider';
import { useApp } from '../context/AppContext';
import { useConversation } from '../hooks/useConversation';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useConversationHistory } from '../hooks/useConversationHistory';
import { AvatarCard } from '../components/ui/AvatarCard';
import { ChatBubble } from '../components/ui/ChatBubble';
import { VoiceInputButton } from '../components/ui/VoiceInputButton';
import { AgentSelector, Agent } from '../components/ui/AgentSelector';
import { SuggestionChips, Suggestion } from '../components/ui/SuggestionChips';

export const IntegratedModernChatScreen: React.FC = () => {
  const { colors } = useTheme();
  const { state: appState, setActiveAgent } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Hooks
  const {
    messages,
    activeAgentId,
    isTyping,
    isRecording: conversationRecording,
    sendMessage,
    switchAgent,
    addReaction,
    clearConversation,
    setRecording: setConversationRecording,
  } = useConversation();

  const {
    isRecording: voiceRecording,
    transcript,
    startRecording,
    stopRecording,
    speak,
  } = useVoiceRecording();

  const {
    saveConversation,
  } = useConversationHistory();

  // State
  const [inputText, setInputText] = React.useState('');
  const [showAgentSelector, setShowAgentSelector] = React.useState(false);

  const currentAgent = appState.agents.find(a => a.id === activeAgentId) || appState.agents[0];

  const getAvatarStatus = (): 'idle' | 'listening' | 'thinking' | 'speaking' => {
    if (voiceRecording) return 'listening';
    if (isTyping) return 'thinking';
    return 'idle';
  };

  // Suggestions based on agent
  const getSuggestions = (): Suggestion[] => {
    const baseSuggestions: Record<string, Suggestion[]> = {
      core: [
        { id: '1', text: 'Tell me a joke', icon: '😄' },
        { id: '2', text: 'What can you help with?', icon: '❓' },
        { id: '3', text: 'Give me advice', icon: '💡' },
      ],
      vision: [
        { id: '1', text: 'Analyze an image', icon: '🖼️' },
        { id: '2', text: 'Describe this photo', icon: '📸' },
        { id: '3', text: 'Find objects', icon: '🔍' },
      ],
      creativity: [
        { id: '1', text: 'Write a story', icon: '📖' },
        { id: '2', text: 'Create a poem', icon: '✍️' },
        { id: '3', text: 'Brainstorm ideas', icon: '💭' },
      ],
      ocr: [
        { id: '1', text: 'Read this text', icon: '📝' },
        { id: '2', text: 'Extract information', icon: '📄' },
        { id: '3', text: 'Scan document', icon: '📋' },
      ],
    };

    return baseSuggestions[activeAgentId] || baseSuggestions.core;
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Auto-save conversation
  useEffect(() => {
    if (messages.length > 0) {
      saveConversation(messages, activeAgentId).catch(console.error);
    }
  }, [messages, activeAgentId, saveConversation]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript) {
      handleSendMessage(transcript);
    }
  }, [transcript]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setInputText('');
    await sendMessage(text);
  };

  const handleVoiceStart = async () => {
    setConversationRecording(true);
    await startRecording();
  };

  const handleVoiceStop = async () => {
    setConversationRecording(false);
    await stopRecording();
  };

  const handleSuggestion = (suggestion: Suggestion) => {
    handleSendMessage(suggestion.text);
  };

  const handleAgentSwitch = (agentId: string) => {
    switchAgent(agentId);
    setActiveAgent(agentId);
    setShowAgentSelector(false);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearConversation,
        },
      ]
    );
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
          
          {/* Clear button */}
          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearChat}
            >
              <Text style={[styles.clearText, { color: colors.text.secondary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Agent Selector */}
        {showAgentSelector && (
          <AgentSelector
            agents={appState.agents}
            activeAgent={activeAgentId}
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
          {messages.map(message => (
            <ChatBubble
              key={message.id}
              text={message.text}
              isUser={message.isUser}
              agentName={currentAgent.name}
              agentColor={currentAgent.color}
              timestamp={message.timestamp}
              reactions={message.reactions}
              onReaction={(emoji) => addReaction(message.id, emoji)}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && (
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
            suggestions={getSuggestions()}
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
                placeholder={`Message ${currentAgent.name}...`}
                placeholderTextColor={colors.text.tertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!voiceRecording}
              />
              
              <TouchableOpacity
                onPress={() => handleSendMessage(inputText)}
                disabled={!inputText.trim()}
                style={[
                  styles.sendButton,
                  { backgroundColor: inputText.trim() ? colors.primary : colors.border.main },
                ]}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Voice Input */}
          {appState.voiceEnabled && (
            <View style={styles.voiceButtonContainer}>
              <VoiceInputButton
                isRecording={voiceRecording}
                onStartRecording={handleVoiceStart}
                onStopRecording={handleVoiceStop}
                mode="toggle"
                size={56}
              />
            </View>
          )}
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
    position: 'relative',
  },
  
  clearButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  clearText: {
    fontSize: 14,
    fontWeight: '600',
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
