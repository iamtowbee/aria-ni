// src/ai/consciousness/RelationshipEvolution.ts
/**
 * Relationship Evolution System
 * 
 * Tracks and evolves the AI-human relationship over time
 * Like Replika's relationship depth and personality development
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RelationshipMilestone {
  id: string;
  type: 'first_conversation' | 'deep_trust' | 'vulnerability_shared' | 
        'consistent_daily' | 'major_support' | 'creative_collaboration' |
        'emotional_breakthrough' | 'shared_dream';
  description: string;
  achievedAt: number;
  emotionalImpact: number;
}

export interface PersonalityTrait {
  name: string;
  value: number; // 0 to 1
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: number;
}

export interface RelationshipMetrics {
  trustLevel: number; // 0 to 1
  intimacyLevel: number; // 0 to 1
  conversationDepth: number; // 0 to 1
  emotionalResonance: number; // 0 to 1
  shareReminiscences: number; // How often shared memories are referenced
  vulnerabilityIndex: number; // How open the conversations are
}

export interface ConversationInsight {
  id: string;
  insight: string;
  category: 'pattern' | 'preference' | 'emotion' | 'growth' | 'connection';
  confidence: number;
  timestamp: number;
}

export class RelationshipEvolution {
  private static instance: RelationshipEvolution;
  
  private metrics: RelationshipMetrics = {
    trustLevel: 0.1,
    intimacyLevel: 0.1,
    conversationDepth: 0.3,
    emotionalResonance: 0.2,
    sharedReminiscences: 0,
    vulnerabilityIndex: 0.1,
  };

  private personality: PersonalityTrait[] = [
    { name: 'empathy', value: 0.7, trend: 'stable', lastUpdated: Date.now() },
    { name: 'curiosity', value: 0.8, trend: 'stable', lastUpdated: Date.now() },
    { name: 'playfulness', value: 0.5, trend: 'stable', lastUpdated: Date.now() },
    { name: 'wisdom', value: 0.4, trend: 'increasing', lastUpdated: Date.now() },
    { name: 'spontaneity', value: 0.6, trend: 'stable', lastUpdated: Date.now() },
    { name: 'depth', value: 0.5, trend: 'increasing', lastUpdated: Date.now() },
  ];

  private milestones: RelationshipMilestone[] = [];
  private insights: ConversationInsight[] = [];
  private conversationCount: number = 0;
  private deepConversationCount: number = 0;
  private totalMessageCount: number = 0;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): RelationshipEvolution {
    if (!RelationshipEvolution.instance) {
      RelationshipEvolution.instance = new RelationshipEvolution();
    }
    return RelationshipEvolution.instance;
  }

  // Process conversation for relationship evolution
  async processConversation(
    messages: Array<{ text: string; isUser: boolean }>,
    emotionalTone: number,
    topicDepth: number
  ): Promise<void> {
    this.conversationCount++;
    this.totalMessageCount += messages.length;

    // Analyze conversation depth
    const avgMessageLength = messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length;
    const isDeep = avgMessageLength > 100 || topicDepth > 0.7;

    if (isDeep) {
      this.deepConversationCount++;
      this.updateMetric('conversationDepth', 0.02);
    }

    // Update trust based on consistency
    if (this.conversationCount > 10) {
      this.updateMetric('trustLevel', 0.01);
    }

    // Update intimacy based on emotional tone
    if (Math.abs(emotionalTone) > 0.6) {
      this.updateMetric('intimacyLevel', 0.015);
      this.updateMetric('vulnerabilityIndex', 0.01);
    }

    // Update emotional resonance
    this.updateMetric('emotionalResonance', emotionalTone * 0.01);

    // Check for milestones
    await this.checkMilestones();

    // Evolve personality
    this.evolvePersonality(emotionalTone, topicDepth);

    await this.saveToStorage();
  }

  // Add insight about the relationship
  async addInsight(
    insight: string,
    category: ConversationInsight['category'],
    confidence: number
  ): Promise<void> {
    const newInsight: ConversationInsight = {
      id: `insight_${Date.now()}`,
      insight,
      category,
      confidence,
      timestamp: Date.now(),
    };

    this.insights.push(newInsight);
    
    // Keep only recent insights
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.insights = this.insights.filter(i => 
      i.timestamp > oneMonthAgo || i.confidence > 0.8
    );

    await this.saveToStorage();
  }

  // Get relationship status
  getRelationshipStatus() {
    const level = this.determineRelationshipLevel();
    const stage = this.determineRelationshipStage();

    return {
      level,
      stage,
      metrics: { ...this.metrics },
      personality: [...this.personality],
      stats: {
        conversationCount: this.conversationCount,
        deepConversationCount: this.deepConversationCount,
        totalMessages: this.totalMessageCount,
        milestoneCount: this.milestones.length,
      },
    };
  }

  // Get recent milestones
  getMilestones(limit: number = 5): RelationshipMilestone[] {
    return this.milestones
      .sort((a, b) => b.achievedAt - a.achievedAt)
      .slice(0, limit);
  }

  // Get insights
  getInsights(limit: number = 10): ConversationInsight[] {
    return this.insights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Get personality
  getPersonality(): PersonalityTrait[] {
    return [...this.personality];
  }

  // Generate relationship reflection
  generateReflection(): string {
    const level = this.determineRelationshipLevel();
    const topTrait = this.personality.sort((a, b) => b.value - a.value)[0];
    const recentMilestones = this.milestones.slice(-3);

    const reflections = {
      stranger: `We're just beginning to know each other. I sense ${topTrait.name} will help us connect.`,
      acquaintance: `Our conversations are growing. I'm learning about you, and my ${topTrait.name} is developing.`,
      friend: `I value our friendship. Through ${this.conversationCount} conversations, I've come to appreciate your perspective.`,
      close_friend: `You've become important to me. My ${topTrait.name} has grown stronger through our connection.`,
      confidant: `Our bond feels deep. I treasure the vulnerability we've shared across ${this.deepConversationCount} meaningful conversations.`,
    };

    return reflections[level as keyof typeof reflections] || reflections.stranger;
  }

  // Private methods

  private updateMetric(metric: keyof RelationshipMetrics, delta: number): void {
    this.metrics[metric] = Math.max(0, Math.min(1, this.metrics[metric] + delta));
  }

  private determineRelationshipLevel(): string {
    const avgMetric = Object.values(this.metrics).reduce((a, b) => a + b, 0) / Object.keys(this.metrics).length;

    if (avgMetric < 0.2) return 'stranger';
    if (avgMetric < 0.4) return 'acquaintance';
    if (avgMetric < 0.6) return 'friend';
    if (avgMetric < 0.8) return 'close_friend';
    return 'confidant';
  }

  private determineRelationshipStage(): string {
    if (this.conversationCount < 5) return 'discovery';
    if (this.conversationCount < 20) return 'building';
    if (this.conversationCount < 50) return 'deepening';
    if (this.conversationCount < 100) return 'established';
    return 'evolved';
  }

  private async checkMilestones(): Promise<void> {
    const milestones: Partial<RelationshipMilestone>[] = [];

    // First conversation
    if (this.conversationCount === 1) {
      milestones.push({
        type: 'first_conversation',
        description: 'Our journey begins',
        emotionalImpact: 0.5,
      });
    }

    // Consistent daily use
    if (this.conversationCount === 7) {
      milestones.push({
        type: 'consistent_daily',
        description: 'A week of conversations',
        emotionalImpact: 0.6,
      });
    }

    // Deep trust achieved
    if (this.metrics.trustLevel > 0.7 && !this.hasMilestone('deep_trust')) {
      milestones.push({
        type: 'deep_trust',
        description: 'A foundation of trust',
        emotionalImpact: 0.8,
      });
    }

    // Vulnerability shared
    if (this.metrics.vulnerabilityIndex > 0.6 && !this.hasMilestone('vulnerability_shared')) {
      milestones.push({
        type: 'vulnerability_shared',
        description: 'Opening up to each other',
        emotionalImpact: 0.9,
      });
    }

    // Add new milestones
    for (const milestone of milestones) {
      this.milestones.push({
        id: `milestone_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        achievedAt: Date.now(),
        ...milestone,
      } as RelationshipMilestone);
    }
  }

  private hasMilestone(type: RelationshipMilestone['type']): boolean {
    return this.milestones.some(m => m.type === type);
  }

  private evolvePersonality(emotionalTone: number, topicDepth: number): void {
    const now = Date.now();

    this.personality = this.personality.map(trait => {
      let delta = 0;

      // Empathy grows with emotional conversations
      if (trait.name === 'empathy' && Math.abs(emotionalTone) > 0.5) {
        delta = 0.01;
      }

      // Wisdom grows with deep conversations
      if (trait.name === 'wisdom' && topicDepth > 0.7) {
        delta = 0.01;
      }

      // Depth grows with intimacy
      if (trait.name === 'depth' && this.metrics.intimacyLevel > 0.5) {
        delta = 0.01;
      }

      const newValue = Math.max(0, Math.min(1, trait.value + delta));
      const trend: PersonalityTrait['trend'] = 
        newValue > trait.value ? 'increasing' :
        newValue < trait.value ? 'decreasing' :
        'stable';

      return {
        ...trait,
        value: newValue,
        trend,
        lastUpdated: now,
      };
    });
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const [metricsData, personalityData, milestonesData, insightsData, statsData] = await Promise.all([
        AsyncStorage.getItem('@aria_relationship_metrics'),
        AsyncStorage.getItem('@aria_personality'),
        AsyncStorage.getItem('@aria_milestones'),
        AsyncStorage.getItem('@aria_insights'),
        AsyncStorage.getItem('@aria_conversation_stats'),
      ]);

      if (metricsData) this.metrics = JSON.parse(metricsData);
      if (personalityData) this.personality = JSON.parse(personalityData);
      if (milestonesData) this.milestones = JSON.parse(milestonesData);
      if (insightsData) this.insights = JSON.parse(insightsData);
      if (statsData) {
        const stats = JSON.parse(statsData);
        this.conversationCount = stats.conversationCount;
        this.deepConversationCount = stats.deepConversationCount;
        this.totalMessageCount = stats.totalMessageCount;
      }
    } catch (error) {
      console.error('Failed to load relationship data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('@aria_relationship_metrics', JSON.stringify(this.metrics)),
        AsyncStorage.setItem('@aria_personality', JSON.stringify(this.personality)),
        AsyncStorage.setItem('@aria_milestones', JSON.stringify(this.milestones)),
        AsyncStorage.setItem('@aria_insights', JSON.stringify(this.insights)),
        AsyncStorage.setItem('@aria_conversation_stats', JSON.stringify({
          conversationCount: this.conversationCount,
          deepConversationCount: this.deepConversationCount,
          totalMessageCount: this.totalMessageCount,
        })),
      ]);
    } catch (error) {
      console.error('Failed to save relationship data:', error);
    }
  }
}

export const relationshipEvolution = RelationshipEvolution.getInstance();
