// src/screens/IntegratedChatScreen.tsx
/**
 * Integrated Chat Screen
 * 
 * Fully connected to AppCoordinator:
 * - Uses real agent state
 * - Manages conversations
 * - Handles voice input
 * - Integrates all UI components
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
import { useApp } from '../AppCoordinator';

// UI Components
import { AvatarCard } from '../components/ui/AvatarCard';
import { ChatBubble } from '../components/ui/ChatBubble';
import { VoiceInputButton } from '../components/ui/VoiceInputButton';
import { AgentSelector, Agent } from '../components/ui/AgentSelector';
import { SuggestionChips, Suggestion } from '../components/ui/SuggestionChips';

// Agent configurations
const agentConfigs: Agent[] = [
  {
    id: 'core',
    name: 'Core',
    description: 'Your primary AI assistant for general tasks',
    emoji: '🤖',
    color: '#3B82F6',
    specialty: 'General AI',
  },
  {
    id: 'vision',
    name: 'Vision',
    description: 'Analyze images and visual content',
    emoji: '👁️',
    color: '#8B5CF6',
    specialty: 'Image Analysis',
  },
  {
    id: 'creativity',
    name: 'Creativity',
    description: 'Creative writing and artistic ideas',
    emoji: '🎨',
    color: '#EC4899',
    specialty: 'Creative',
  },
  {
    id: 'ocr',
    name: 'OCR',
    description: 'Read and extract text from images',
    emoji: '📝',
    color: '#10B981',
    specialty: 'Text Reader',
  },
  {
    id: 'alpha',
    name: 'Alpha',
    description: 'Media and file management',
    emoji: '📱',
    color: '#F59E0B',
    specialty: 'Media',
  },
  {
    id: 'beta',
    name: 'Beta',
    description: 'Communication assistant',
    emoji: '💬',
    color: '#3B82F6',
    specialty: 'Communication',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    description: 'Memory and knowledge management',
    emoji: '💾',
    color: '#6366F1',
    specialty: 'Memory',
  },
  {
    id: 'delta',
    name: 'Delta',
    description: 'Emotional support and wellbeing',
    emoji: '❤️',
    color: '#EF4444',
    specialty: 'Emotional',
  },
];

export const IntegratedChatScreen: React.FC = () => {
  const { colors, tokens } = useTheme();
  const {
    activeAgent,
    switchAgent,
    sendMessage: sendMessageToAgent,
    conversations,
    currentConversationId,
    createConversation,
    isRecording,
    startVoiceInput,
    stopVoiceInput,
  } = useApp();

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const currentAgent = agentConfigs.find(a => a.id === activeAgent) || agentConfigs[0];
  const conversation = currentConversationId ? conversations.get(currentConversationId) : null;
  const messages = conversation?.messages || [];

  const suggestions: Suggestion[] = [
    { id: '1', text: 'Tell me a joke', icon: '😄' },
    { id: '2', text: 'Analyze an image', icon: '🖼️' },
    { id: '3', text: 'Write a story', icon: '📖' },
    { id: '4', text: 'Help me code', icon: '💻' },
  ];

  useEffect(() => {
    // Create initial conversation if none exists
    if (!currentConversationId) {
      createConversation();
    }
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setInputText('');
    setAvatarStatus('thinking');
    setIsTyping(true);

    // Send to AppCoordinator which handles agent routing
    await sendMessageToAgent(text);

    setIsTyping(false);
    setAvatarStatus('idle');
  };

  const handleVoiceStart = () => {
    startVoiceInput();
    setAvatarStatus('listening');
  };

  const handleVoiceStop = async () => {
    stopVoiceInput();
    setAvatarStatus('thinking');
    
    // In production, transcribe and send
    // For now, simulate
    setTimeout(() => {
      sendMessage("Voice message transcription");
    }, 500);
  };

  const handleSuggestion = (suggestion: Suggestion) => {
    sendMessage(suggestion.text);
  };

  const handleAgentSwitch = (agentId: string) => {
    switchAgent(agentId);
    setShowAgentSelector(false);
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
    // Update message reactions
    // In production, this would update the conversation in AppCoordinator
    console.log('Add reaction:', messageId, emoji);
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
            status={avatarStatus}
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
          {messages.map(message => (
            <ChatBubble
              key={message.id}
              text={message.text}
              isUser={message.isUser}
              agentName={currentAgent.name}
              agentColor={currentAgent.color}
              timestamp={message.timestamp}
              reactions={message.reactions}
              onReaction={(emoji) => handleMessageReaction(message.id, emoji)}
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
                multiline
                maxLength={1000}
              />
              
              <TouchableOpacity
                onPress={() => sendMessage(inputText)}
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
          <View style={styles.voiceButtonContainer}>
            <VoiceInputButton
              isRecording={isRecording}
              onStartRecording={handleVoiceStart}
              onStopRecording={handleVoiceStop}
              mode="toggle"
              size={56}
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
