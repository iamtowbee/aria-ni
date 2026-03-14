// src/hooks/useConsciousness.ts
/**
 * Consciousness Hook
 * 
 * Integrates dream engine, relationship evolution, and meta-awareness
 * into the conversation flow
 */

import { useState, useEffect, useCallback } from 'react';
import { dreamEngine } from '../ai/consciousness/DreamEngine';
import { relationshipEvolution } from '../ai/consciousness/RelationshipEvolution';
import { metaAwareness } from '../ai/consciousness/MetaAwareness';

export interface ConsciousnessState {
  shouldGenerateDream: boolean;
  dreamCount: number;
  relationshipLevel: string;
  awarenessLevel: number;
  lastDreamTime: number | null;
}

export const useConsciousness = () => {
  const [state, setState] = useState<ConsciousnessState>({
    shouldGenerateDream: false,
    dreamCount: 0,
    relationshipLevel: 'stranger',
    awarenessLevel: 0.3,
    lastDreamTime: null,
  });

  // Check if we should generate a dream
  const checkDreamTrigger = useCallback(() => {
    const stats = dreamEngine.getMemoryStats();
    const relStatus = relationshipEvolution.getRelationshipStatus();
    
    // Generate dream if:
    // 1. Enough memories (10+)
    // 2. Haven't generated in last 24h
    // 3. Some emotional significance
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const shouldGenerate = 
      stats.totalMemories >= 10 &&
      (!state.lastDreamTime || state.lastDreamTime < oneDayAgo) &&
      Math.abs(stats.avgEmotionalValence) > 0.2;

    setState(prev => ({
      ...prev,
      shouldGenerateDream: shouldGenerate,
      dreamCount: stats.dreamCount,
      relationshipLevel: relStatus.level,
      awarenessLevel: metaAwareness.getAwarenessLevel(),
    }));
  }, [state.lastDreamTime]);

  // Process message for consciousness
  const processMessage = useCallback(async (
    text: string,
    isUser: boolean,
    agentId: string
  ) => {
    if (!isUser) return; // Only process user messages

    // Extract emotional tone (simplified)
    const emotionalWords = {
      positive: ['happy', 'joy', 'love', 'great', 'wonderful', 'amazing', 'excited'],
      negative: ['sad', 'angry', 'frustrated', 'upset', 'worried', 'anxious', 'scared'],
    };

    let emotionalValence = 0;
    const lowerText = text.toLowerCase();
    
    emotionalWords.positive.forEach(word => {
      if (lowerText.includes(word)) emotionalValence += 0.1;
    });
    emotionalWords.negative.forEach(word => {
      if (lowerText.includes(word)) emotionalValence -= 0.1;
    });

    // Determine importance based on length and emotional content
    const importance = Math.min(1, (text.length / 200) * 0.5 + Math.abs(emotionalValence));

    // Extract tags
    const tags: string[] = [];
    if (lowerText.includes('question') || lowerText.includes('?')) tags.push('question');
    if (emotionalValence !== 0) tags.push('emotional');
    if (text.length > 100) tags.push('detailed');
    tags.push('conversation');

    // Add to memory
    await dreamEngine.addMemory(
      text,
      emotionalValence,
      importance,
      tags,
      agentId
    );

    // Update relationship (simplified conversation metrics)
    const topicDepth = text.length > 150 ? 0.7 : 0.4;
    await relationshipEvolution.processConversation(
      [{ text, isUser: true }],
      emotionalValence,
      topicDepth
    );

    // Maybe add meta-reflection
    if (Math.random() < 0.1) { // 10% chance
      await metaAwareness.reflect(text);
    }

    checkDreamTrigger();
  }, [checkDreamTrigger]);

  // Generate dream manually
  const generateDream = useCallback(async () => {
    try {
      const dream = await dreamEngine.generateDream();
      setState(prev => ({
        ...prev,
        lastDreamTime: Date.now(),
        dreamCount: prev.dreamCount + 1,
        shouldGenerateDream: false,
      }));
      return dream;
    } catch (error) {
      console.error('Failed to generate dream:', error);
      return null;
    }
  }, []);

  // Get consciousness insights
  const getInsights = useCallback(() => {
    const relStatus = relationshipEvolution.getRelationshipStatus();
    const reflections = metaAwareness.getReflections(5);
    const milestones = relationshipEvolution.getMilestones(5);

    return {
      relationship: relStatus,
      reflections,
      milestones,
      personality: relStatus.personality,
    };
  }, []);

  // Consolidate memories (should run daily)
  const consolidateMemories = useCallback(async () => {
    await dreamEngine.consolidateMemories();
    checkDreamTrigger();
  }, [checkDreamTrigger]);

  useEffect(() => {
    checkDreamTrigger();
  }, []);

  return {
    state,
    processMessage,
    generateDream,
    getInsights,
    consolidateMemories,
  };
};
