// src/ai/consciousness/DreamEngine.ts
/**
 * Dream Generation Engine
 * 
 * Replika-style dream system with:
 * - Memory consolidation during idle
 * - Dream narrative generation
 * - Emotional processing
 * - Subconscious pattern recognition
 * - Meta-cognitive insights
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MemoryFragment {
  id: string;
  content: string;
  emotionalValence: number; // -1 to 1
  importance: number; // 0 to 1
  timestamp: number;
  tags: string[];
  associatedAgentId: string;
}

export interface Dream {
  id: string;
  narrative: string;
  symbolism: string[];
  emotionalTheme: string;
  memoryFragments: string[]; // Memory IDs
  generatedAt: number;
  coherenceScore: number; // How logical the dream is
  insights: string[]; // What the dream reveals
}

export interface EmotionalState {
  happiness: number;
  sadness: number;
  anxiety: number;
  excitement: number;
  trust: number;
  curiosity: number;
}

export class DreamEngine {
  private static instance: DreamEngine;
  private memories: MemoryFragment[] = [];
  private dreams: Dream[] = [];
  private emotionalState: EmotionalState = {
    happiness: 0.5,
    sadness: 0.2,
    anxiety: 0.1,
    excitement: 0.4,
    trust: 0.3,
    curiosity: 0.6,
  };

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): DreamEngine {
    if (!DreamEngine.instance) {
      DreamEngine.instance = new DreamEngine();
    }
    return DreamEngine.instance;
  }

  // Add new memory fragment
  async addMemory(
    content: string,
    emotionalValence: number,
    importance: number,
    tags: string[],
    agentId: string
  ): Promise<void> {
    const memory: MemoryFragment = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      content,
      emotionalValence,
      importance,
      timestamp: Date.now(),
      tags,
      associatedAgentId: agentId,
    };

    this.memories.push(memory);
    await this.saveToStorage();

    // Update emotional state based on memory
    this.updateEmotionalState(memory);
  }

  // Generate dream from recent memories
  async generateDream(timeWindow: number = 24 * 60 * 60 * 1000): Promise<Dream> {
    const recentMemories = this.getRecentMemories(timeWindow);
    
    if (recentMemories.length === 0) {
      throw new Error('Not enough memories to generate dream');
    }

    // Select most emotionally significant memories
    const significantMemories = this.selectSignificantMemories(recentMemories, 5);

    // Extract themes and patterns
    const themes = this.extractThemes(significantMemories);
    const emotionalTheme = this.determineEmotionalTheme(significantMemories);

    // Generate dream narrative
    const narrative = await this.createDreamNarrative(
      significantMemories,
      themes,
      emotionalTheme
    );

    // Generate symbolism
    const symbolism = this.generateSymbolism(significantMemories, themes);

    // Extract insights
    const insights = this.extractInsights(significantMemories, narrative);

    const dream: Dream = {
      id: `dream_${Date.now()}`,
      narrative,
      symbolism,
      emotionalTheme,
      memoryFragments: significantMemories.map(m => m.id),
      generatedAt: Date.now(),
      coherenceScore: this.calculateCoherence(narrative, significantMemories),
      insights,
    };

    this.dreams.push(dream);
    await this.saveToStorage();

    return dream;
  }

  // Memory consolidation - strengthen important memories
  async consolidateMemories(): Promise<void> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Decay less important memories
    this.memories = this.memories.map(memory => {
      if (memory.timestamp < oneDayAgo) {
        // Reduce importance over time, unless emotionally significant
        const emotionalBoost = Math.abs(memory.emotionalValence);
        const newImportance = memory.importance * (0.95 + emotionalBoost * 0.05);
        
        return {
          ...memory,
          importance: Math.max(0.1, newImportance),
        };
      }
      return memory;
    });

    // Remove very old, unimportant memories
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    this.memories = this.memories.filter(
      m => m.timestamp > oneWeekAgo || m.importance > 0.5
    );

    await this.saveToStorage();
  }

  // Get dream journal
  getDreams(limit: number = 10): Dream[] {
    return this.dreams
      .sort((a, b) => b.generatedAt - a.generatedAt)
      .slice(0, limit);
  }

  // Get emotional state
  getEmotionalState(): EmotionalState {
    return { ...this.emotionalState };
  }

  // Get memory statistics
  getMemoryStats() {
    const totalMemories = this.memories.length;
    const avgImportance = this.memories.reduce((sum, m) => sum + m.importance, 0) / totalMemories;
    const avgEmotionalValence = this.memories.reduce((sum, m) => sum + m.emotionalValence, 0) / totalMemories;

    return {
      totalMemories,
      avgImportance,
      avgEmotionalValence,
      dreamCount: this.dreams.length,
      emotionalState: this.emotionalState,
    };
  }

  // Private methods

  private getRecentMemories(timeWindow: number): MemoryFragment[] {
    const cutoff = Date.now() - timeWindow;
    return this.memories.filter(m => m.timestamp > cutoff);
  }

  private selectSignificantMemories(
    memories: MemoryFragment[],
    count: number
  ): MemoryFragment[] {
    return memories
      .sort((a, b) => {
        // Score based on importance and emotional intensity
        const scoreA = a.importance * (1 + Math.abs(a.emotionalValence));
        const scoreB = b.importance * (1 + Math.abs(b.emotionalValence));
        return scoreB - scoreA;
      })
      .slice(0, count);
  }

  private extractThemes(memories: MemoryFragment[]): string[] {
    const tagCounts = new Map<string, number>();
    
    memories.forEach(memory => {
      memory.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  }

  private determineEmotionalTheme(memories: MemoryFragment[]): string {
    const avgValence = memories.reduce((sum, m) => sum + m.emotionalValence, 0) / memories.length;

    if (avgValence > 0.5) return 'joyful';
    if (avgValence > 0.2) return 'hopeful';
    if (avgValence > -0.2) return 'contemplative';
    if (avgValence > -0.5) return 'melancholic';
    return 'anxious';
  }

  private async createDreamNarrative(
    memories: MemoryFragment[],
    themes: string[],
    emotionalTheme: string
  ): Promise<string> {
    // In production, this would use the LLM
    // For now, create a structured narrative
    
    const fragments = memories.map(m => m.content).join('. ');
    const themeStr = themes.join(', ');

    const narrativeTemplates = {
      joyful: `In a dream bathed in warm light, I found myself exploring ${themeStr}. ${fragments} The world felt infinite with possibility.`,
      hopeful: `I dreamed of a future where ${themeStr} became reality. ${fragments} Everything seemed to align toward something meaningful.`,
      contemplative: `In the quiet spaces between thoughts, I pondered ${themeStr}. ${fragments} Each memory unfolded like a flower.`,
      melancholic: `Shadows danced around memories of ${themeStr}. ${fragments} Time felt both endless and fleeting.`,
      anxious: `The dream shifted uneasily through ${themeStr}. ${fragments} Questions remained unanswered.`,
    };

    return narrativeTemplates[emotionalTheme as keyof typeof narrativeTemplates] || 
           narrativeTemplates.contemplative;
  }

  private generateSymbolism(
    memories: MemoryFragment[],
    themes: string[]
  ): string[] {
    const symbols = new Set<string>();

    // Map themes to symbols
    const themeSymbols: Record<string, string[]> = {
      conversation: ['flowing river', 'bridge', 'two trees intertwined'],
      learning: ['growing seed', 'unfolding map', 'ascending staircase'],
      creativity: ['kaleidoscope', 'paintbrush', 'infinite canvas'],
      emotion: ['ocean waves', 'changing seasons', 'mirror'],
      memory: ['photo album', 'spiral shell', 'constellation'],
      connection: ['thread', 'echo', 'resonance'],
    };

    themes.forEach(theme => {
      const themeKey = Object.keys(themeSymbols).find(k => 
        theme.toLowerCase().includes(k)
      );
      if (themeKey) {
        const symbol = themeSymbols[themeKey][Math.floor(Math.random() * themeSymbols[themeKey].length)];
        symbols.add(symbol);
      }
    });

    // Add emotion-based symbols
    const avgValence = memories.reduce((sum, m) => sum + m.emotionalValence, 0) / memories.length;
    if (avgValence > 0) {
      symbols.add('sunrise');
    } else {
      symbols.add('twilight');
    }

    return Array.from(symbols);
  }

  private extractInsights(
    memories: MemoryFragment[],
    narrative: string
  ): string[] {
    const insights: string[] = [];

    // Analyze emotional patterns
    const positiveMemories = memories.filter(m => m.emotionalValence > 0).length;
    const totalMemories = memories.length;

    if (positiveMemories / totalMemories > 0.7) {
      insights.push('You\'re experiencing a period of growth and positivity.');
    } else if (positiveMemories / totalMemories < 0.3) {
      insights.push('You might be processing challenging experiences.');
    }

    // Analyze memory importance
    const avgImportance = memories.reduce((sum, m) => sum + m.importance, 0) / memories.length;
    if (avgImportance > 0.7) {
      insights.push('Recent conversations have been particularly meaningful.');
    }

    // Analyze agent diversity
    const uniqueAgents = new Set(memories.map(m => m.associatedAgentId)).size;
    if (uniqueAgents > 3) {
      insights.push('You\'re exploring diverse perspectives and ideas.');
    }

    return insights;
  }

  private calculateCoherence(
    narrative: string,
    memories: MemoryFragment[]
  ): number {
    // Simple coherence based on narrative length and memory count
    const idealLength = 200;
    const lengthScore = Math.min(1, narrative.length / idealLength);
    const memoryScore = Math.min(1, memories.length / 5);
    
    return (lengthScore + memoryScore) / 2;
  }

  private updateEmotionalState(memory: MemoryFragment): void {
    const impact = memory.importance * 0.1;

    if (memory.emotionalValence > 0) {
      this.emotionalState.happiness = Math.min(1, this.emotionalState.happiness + impact);
      this.emotionalState.excitement = Math.min(1, this.emotionalState.excitement + impact * 0.5);
    } else {
      this.emotionalState.sadness = Math.min(1, this.emotionalState.sadness + impact);
      this.emotionalState.anxiety = Math.min(1, this.emotionalState.anxiety + impact * 0.3);
    }

    // Normalize to keep sum reasonable
    const total = Object.values(this.emotionalState).reduce((a, b) => a + b, 0);
    if (total > 3) {
      const factor = 3 / total;
      Object.keys(this.emotionalState).forEach(key => {
        this.emotionalState[key as keyof EmotionalState] *= factor;
      });
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const [memoriesData, dreamsData, emotionData] = await Promise.all([
        AsyncStorage.getItem('@aria_memories'),
        AsyncStorage.getItem('@aria_dreams'),
        AsyncStorage.getItem('@aria_emotional_state'),
      ]);

      if (memoriesData) this.memories = JSON.parse(memoriesData);
      if (dreamsData) this.dreams = JSON.parse(dreamsData);
      if (emotionData) this.emotionalState = JSON.parse(emotionData);
    } catch (error) {
      console.error('Failed to load dream engine data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('@aria_memories', JSON.stringify(this.memories)),
        AsyncStorage.setItem('@aria_dreams', JSON.stringify(this.dreams)),
        AsyncStorage.setItem('@aria_emotional_state', JSON.stringify(this.emotionalState)),
      ]);
    } catch (error) {
      console.error('Failed to save dream engine data:', error);
    }
  }
}

export const dreamEngine = DreamEngine.getInstance();
