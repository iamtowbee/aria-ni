// src/hooks/useConversation.ts
/**
 * Conversation Hook
 * 
 * Manages conversation state and agent interactions
 */

import { useState, useCallback, useRef } from 'react';
import { AgentFactory, AgentAdapter } from './adapters/AgentAdapter';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  agentId: string;
  timestamp: number;
  reactions?: string[];
  imageUri?: string;
}

export interface ConversationState {
  messages: Message[];
  activeAgentId: string;
  isTyping: boolean;
  isRecording: boolean;
  error: string | null;
}

export const useConversation = () => {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    activeAgentId: 'core',
    isTyping: false,
    isRecording: false,
    error: null,
  });

  // Agent cache
  const agentCache = useRef<Record<string, AgentAdapter>>({}).current;

  const getAgent = useCallback((agentId: string): AgentAdapter => {
    if (!agentCache[agentId]) {
      agentCache[agentId] = AgentFactory.createAgent(agentId);
    }
    return agentCache[agentId];
  }, [agentCache]);

  const currentAgent = getAgent(state.activeAgentId);

  // Send message
  const sendMessage = useCallback(async (text: string, imageUri?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      agentId: state.activeAgentId,
      timestamp: Date.now(),
      imageUri,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
      error: null,
    }));

    try {
      // Process message with agent
      let response: string;
      
      if (imageUri && currentAgent.processImage) {
        response = await currentAgent.processImage(imageUri, text);
      } else {
        response = await currentAgent.processMessage(text);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        agentId: state.activeAgentId,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isTyping: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isTyping: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  }, [state.activeAgentId, currentAgent]);

  // Switch agent
  const switchAgent = useCallback((agentId: string) => {
    setState(prev => ({
      ...prev,
      activeAgentId: agentId,
    }));
  }, []);

  // Add reaction
  const addReaction = useCallback((messageId: string, emoji: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
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
      }),
    }));
  }, []);

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId),
    }));
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
    }));
  }, []);

  // Set recording state
  const setRecording = useCallback((isRecording: boolean) => {
    setState(prev => ({ ...prev, isRecording }));
  }, []);

  return {
    messages: state.messages,
    activeAgentId: state.activeAgentId,
    isTyping: state.isTyping,
    isRecording: state.isRecording,
    error: state.error,
    sendMessage,
    switchAgent,
    addReaction,
    deleteMessage,
    clearConversation,
    setRecording,
    currentAgent,
  };
};
