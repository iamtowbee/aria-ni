// src/screens/ModernChatScreen.tsx
/**
 * Modern Chat Screen
 * 
 * Using all new UI components inspired by popular AI apps
 * - AvatarCard for agent display
 * - ChatBubble for messages
 * - VoiceInputButton for voice interaction
 * - AgentSelector for switching agents
 * - SuggestionChips for quick actions
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
import { AvatarCard } from '../components/ui/AvatarCard';
import { ChatBubble } from '../components/ui/ChatBubble';
import { VoiceInputButton } from '../components/ui/VoiceInputButton';
import { AgentSelector, Agent } from '../components/ui/AgentSelector';
import { SuggestionChips, Suggestion } from '../components/ui/SuggestionChips';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  reactions?: string[];
}

const agents: Agent[] = [
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
];

export const ModernChatScreen: React.FC = () => {
  const { colors, tokens } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! I'm Aria Nova. I'm here to help you with anything you need. What would you like to talk about?",
      isUser: false,
      timestamp: Date.now() - 5000,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeAgent, setActiveAgent] = useState('core');
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const currentAgent = agents.find(a => a.id === activeAgent) || agents[0];

  const suggestions: Suggestion[] = [
    { id: '1', text: 'Tell me a joke', icon: '😄' },
    { id: '2', text: 'Analyze an image', icon: '🖼️' },
    { id: '3', text: 'Write a story', icon: '📖' },
    { id: '4', text: 'Help me code', icon: '💻' },
  ];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAvatarStatus('thinking');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I understand you said: "${text}". This is a simulated response from ${currentAgent.name}. In a production app, this would connect to your AI backend.`,
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      setAvatarStatus('idle');
    }, 2000);
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
    setAvatarStatus('listening');
  };

  const handleVoiceStop = () => {
    setIsRecording(false);
    setAvatarStatus('thinking');
    
    // Simulate voice transcription
    setTimeout(() => {
      sendMessage("This is a voice message transcription");
    }, 500);
  };

  const handleSuggestion = (suggestion: Suggestion) => {
    sendMessage(suggestion.text);
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        return {
          ...msg,
          reactions: reactions.includes(emoji)
            ? reactions.filter(r => r !== emoji)
            : [...reactions, emoji],
        };
      }
      return msg;
    }));
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
            agents={agents}
            activeAgent={activeAgent}
            onSelectAgent={(id) => {
              setActiveAgent(id);
              setShowAgentSelector(false);
            }}
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
        {messages.length <= 1 && (
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
