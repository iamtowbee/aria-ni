// src/hooks/useConversationHistory.ts
/**
 * Conversation History Hook
 * 
 * Manages saving and loading conversation history
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './useConversation';

export interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  agentId: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = '@aria_nova_conversations';

export const useConversationHistory = () => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setConversations(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConversation = useCallback(async (
    messages: Message[],
    agentId: string,
    conversationId?: string
  ) => {
    try {
      const now = Date.now();
      
      // Generate title from first user message
      const firstMessage = messages.find(m => m.isUser);
      const title = firstMessage?.text.slice(0, 50) || 'New Conversation';

      const conversation: SavedConversation = {
        id: conversationId || now.toString(),
        title,
        messages,
        agentId,
        createdAt: conversationId ? 
          conversations.find(c => c.id === conversationId)?.createdAt || now : 
          now,
        updatedAt: now,
      };

      const updated = conversationId
        ? conversations.map(c => c.id === conversationId ? conversation : c)
        : [conversation, ...conversations];

      setConversations(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return conversation.id;
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }, [conversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const updated = conversations.filter(c => c.id !== conversationId);
      setConversations(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [conversations]);

  const getConversation = useCallback((conversationId: string) => {
    return conversations.find(c => c.id === conversationId);
  }, [conversations]);

  const searchConversations = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return conversations.filter(c =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.messages.some(m => m.text.toLowerCase().includes(lowerQuery))
    );
  }, [conversations]);

  const filterByAgent = useCallback((agentId: string) => {
    return conversations.filter(c => c.agentId === agentId);
  }, [conversations]);

  return {
    conversations,
    loading,
    saveConversation,
    deleteConversation,
    getConversation,
    searchConversations,
    filterByAgent,
    loadConversations,
  };
};
