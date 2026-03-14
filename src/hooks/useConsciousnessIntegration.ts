// src/hooks/useConsciousnessIntegration.ts
/**
 * Consciousness Integration Hook
 * 
 * Integrates dream engine, relationship evolution, and meta-awareness
 * into conversations
 */

import { useEffect } from 'react';
import { dreamEngine } from '../ai/consciousness/DreamEngine';
import { relationshipEvolution } from '../ai/consciousness/RelationshipEvolution';
import { metaAwareness } from '../ai/consciousness/MetaAwareness';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  agentId: string;
}

export const useConsciousnessIntegration = () => {
  // Process messages for consciousness systems
  const processMessage = async (
    message: Message,
    agentId: string,
    emotionalTone: number = 0,
    topicDepth: number = 0.5
  ) => {
    try {
      // Add to memory if it's a meaningful conversation
      if (message.text.length > 20) {
        const importance = calculateImportance(message.text, topicDepth);
        const tags = extractTags(message.text);
        
        await dreamEngine.addMemory(
          message.text,
          emotionalTone,
          importance,
          tags,
          agentId
        );
      }

      // Update relationship based on conversation
      // (This would be called after a full conversation, not per message)
    } catch (error) {
      console.error('Consciousness processing error:', error);
    }
  };

  // Process full conversation
  const processConversation = async (
    messages: Message[],
    emotionalTone: number,
    topicDepth: number
  ) => {
    try {
      await relationshipEvolution.processConversation(
        messages.map(m => ({ text: m.text, isUser: m.isUser })),
        emotionalTone,
        topicDepth
      );
    } catch (error) {
      console.error('Relationship processing error:', error);
    }
  };

  // Generate dream periodically
  const maybeGenerateDream = async (): Promise<boolean> => {
    try {
      const stats = dreamEngine.getMemoryStats();
      
      // Generate dream if we have enough memories and haven't dreamed recently
      if (stats.totalMemories > 10) {
        const dreams = dreamEngine.getDreams(1);
        const lastDream = dreams[0];
        const hoursSinceLastDream = lastDream
          ? (Date.now() - lastDream.generatedAt) / (1000 * 60 * 60)
          : 24;

        if (hoursSinceLastDream > 12) {
          await dreamEngine.generateDream();
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Consolidate memories periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      await dreamEngine.consolidateMemories();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, []);

  return {
    processMessage,
    processConversation,
    maybeGenerateDream,
    getRelationshipStatus: () => relationshipEvolution.getRelationshipStatus(),
    getMemoryStats: () => dreamEngine.getMemoryStats(),
    generateReflection: (context: string) => metaAwareness.reflect(context),
  };
};

// Helper functions
function calculateImportance(text: string, topicDepth: number): number {
  const length = text.length;
  const wordCount = text.split(' ').length;
  
  // Base importance on length and depth
  const lengthScore = Math.min(1, length / 500);
  const wordScore = Math.min(1, wordCount / 50);
  
  return (lengthScore + wordScore + topicDepth) / 3;
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Detect conversation themes
  const themeMap: Record<string, string[]> = {
    emotion: ['feel', 'emotion', 'happy', 'sad', 'anxious', 'excited', 'love'],
    learning: ['learn', 'understand', 'know', 'discover', 'realize'],
    creativity: ['create', 'imagine', 'design', 'art', 'music', 'write'],
    memory: ['remember', 'recall', 'forget', 'past', 'memory'],
    future: ['will', 'going to', 'plan', 'hope', 'dream', 'future'],
    question: ['why', 'how', 'what', 'when', 'where', 'who'],
    conversation: ['talk', 'discuss', 'conversation', 'chat'],
  };

  Object.entries(themeMap).forEach(([theme, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      tags.push(theme);
    }
  });

  return tags.length > 0 ? tags : ['general'];
}
