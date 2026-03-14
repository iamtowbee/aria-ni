// src/components/smart/inputs/SmartMessageInput.tsx
/**
 * Smart Message Input
 * 
 * Intelligent input with:
 * - Auto-complete suggestions
 * - Voice input button
 * - Context-aware placeholder
 * - Agent switcher
 * - Multi-line support
 * - Attachment options
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

export interface MessageSuggestion {
  text: string;
  icon?: string;
  action?: () => void;
}

export interface SmartMessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  suggestions?: MessageSuggestion[];
  activeAgent?: string;
  onAgentChange?: (agent: string) => void;
  onVoicePress?: () => void;
  onAttachPress?: () => void;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  showAgentPicker?: boolean;
}

/**
 * SmartMessageInput
 * 
 * Context-aware message input with intelligent features
 */
export const SmartMessageInput: React.FC<SmartMessageInputProps> = ({
  onSend,
  placeholder = 'Type a message...',
  suggestions = [],
  activeAgent = 'Core',
  onAgentChange,
  onVoicePress,
  onAttachPress,
  multiline = true,
  maxLength = 5000,
  autoFocus = false,
  showAgentPicker = true,
}) => {
  const [message, setMessage] = useState('');
  const [height, setHeight] = useState(40);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Smart placeholder based on active agent
  const getSmartPlaceholder = (): string => {
    const agentPlaceholders: Record<string, string> = {
      Core: 'Ask me anything...',
      Vision: 'Describe or analyze an image...',
      OCR: 'What text do you want to read?',
      Creativity: 'What should I create?',
      Alpha: 'Select or capture media...',
      Beta: 'What should I say?',
      Gamma: 'What would you like to remember?',
      Delta: 'How are you feeling?',
    };

    return agentPlaceholders[activeAgent] || placeholder;
  };

  // Filter suggestions based on input
  const getFilteredSuggestions = (): MessageSuggestion[] => {
    if (message.length < 2) return [];
    
    const lower = message.toLowerCase();
    return suggestions.filter(s => 
      s.text.toLowerCase().includes(lower)
    ).slice(0, 3);
  };

  const handleSend = () => {
    if (message.trim().length === 0) return;

    // Animate button
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSend(message.trim());
    setMessage('');
    setHeight(40);
    setShowSuggestions(false);
  };

  const handleSuggestionPress = (suggestion: MessageSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else {
      setMessage(suggestion.text);
      inputRef.current?.focus();
    }
    setShowSuggestions(false);
  };

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <View style={styles.container}>
      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Agent Picker */}
      {showAgentPicker && (
        <View style={styles.agentBar}>
          <Text style={styles.agentLabel}>Active:</Text>
          <TouchableOpacity
            style={styles.agentButton}
            onPress={() => onAgentChange?.('Vision')}
          >
            <Text style={[
              styles.agentText,
              activeAgent === 'Vision' && styles.agentActive
            ]}>👁 Vision</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.agentButton}
            onPress={() => onAgentChange?.('Creativity')}
          >
            <Text style={[
              styles.agentText,
              activeAgent === 'Creativity' && styles.agentActive
            ]}>🎨 Creative</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.agentButton}
            onPress={() => onAgentChange?.('OCR')}
          >
            <Text style={[
              styles.agentText,
              activeAgent === 'OCR' && styles.agentActive
            ]}>📝 OCR</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Attach Button */}
        {onAttachPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onAttachPress}
          >
            <Text style={styles.icon}>📎</Text>
          </TouchableOpacity>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[styles.input, { height: Math.max(40, height) }]}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            setShowSuggestions(text.length > 0);
          }}
          placeholder={getSmartPlaceholder()}
          placeholderTextColor="#999"
          multiline={multiline}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onContentSizeChange={(e) => {
            if (multiline) {
              setHeight(e.nativeEvent.contentSize.height);
            }
          }}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={!multiline}
        />

        {/* Voice Button */}
        {onVoicePress && message.length === 0 && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onVoicePress}
          >
            <Text style={styles.icon}>🎤</Text>
          </TouchableOpacity>
        )}

        {/* Send Button */}
        {message.trim().length > 0 && (
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Character Counter */}
      {message.length > maxLength * 0.8 && (
        <Text style={styles.counter}>
          {message.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  
  suggestionsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  
  agentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  agentLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  
  agentButton: {
    marginHorizontal: 4,
  },
  
  agentText: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  agentActive: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  icon: {
    fontSize: 20,
  },
  
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 120,
    color: '#000',
  },
  
  sendButton: {
    width: 36,
    height: 36,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  sendIcon: {
    color: '#fff',
    fontSize: 18,
  },
  
  counter: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
