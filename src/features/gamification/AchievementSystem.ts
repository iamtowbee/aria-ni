// src/features/gamification/AchievementSystem.ts
/**
 * Achievement & Gamification System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from '../analytics/AnalyticsSystem';

// ==================== TYPES ====================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'conversation' | 'learning' | 'social' | 'collection' | 'premium';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirement: {
    type: string;
    target: number;
  };
  reward?: {
    type: 'coins' | 'avatar' | 'theme' | 'boost';
    value: string | number;
  };
}

export interface UserProgress {
  level: number;
  xp: number;
  totalXp: number;
  coins: number;
  achievements: string[];
  stats: {
    messagesCount: number;
    conversationsCount: number;
    daysStreak: number;
    lastActiveDate: string;
    totalTimeSpent: number;
  };
}

// ==================== ACHIEVEMENTS CATALOG ====================

export const ACHIEVEMENTS: Achievement[] = [
  // Conversation
  {
    id: 'first_conversation',
    title: 'First Steps',
    description: 'Have your first conversation with Aria-Nova',
    icon: '💬',
    category: 'conversation',
    rarity: 'common',
    points: 10,
    requirement: { type: 'conversations', target: 1 },
  },
  {
    id: 'chatty',
    title: 'Chatty',
    description: 'Send 100 messages',
    icon: '💭',
    category: 'conversation',
    rarity: 'common',
    points: 50,
    requirement: { type: 'messages', target: 100 },
  },
  {
    id: 'conversationalist',
    title: 'Conversationalist',
    description: 'Have 50 conversations',
    icon: '🗣️',
    category: 'conversation',
    rarity: 'rare',
    points: 100,
    requirement: { type: 'conversations', target: 50 },
  },
  
  // Learning
  {
    id: 'jow_student',
    title: 'Jow Student',
    description: 'Help Jow reach age 7',
    icon: '🦉',
    category: 'learning',
    rarity: 'rare',
    points: 150,
    requirement: { type: 'jow_age', target: 7 },
    reward: { type: 'avatar', value: 'jow_graduate' },
  },
  {
    id: 'memory_master',
    title: 'Memory Master',
    description: 'Create 1000 memories',
    icon: '🧠',
    category: 'learning',
    rarity: 'epic',
    points: 300,
    requirement: { type: 'memories', target: 1000 },
  },
  
  // Streak
  {
    id: 'week_streak',
    title: 'Dedicated',
    description: '7 day conversation streak',
    icon: '🔥',
    category: 'social',
    rarity: 'rare',
    points: 200,
    requirement: { type: 'streak', target: 7 },
    reward: { type: 'coins', value: 100 },
  },
  {
    id: 'month_streak',
    title: 'Unstoppable',
    description: '30 day conversation streak',
    icon: '⚡',
    category: 'social',
    rarity: 'legendary',
    points: 1000,
    requirement: { type: 'streak', target: 30 },
    reward: { type: 'theme', value: 'legendary_fire' },
  },
  
  // Collection
  {
    id: 'collector',
    title: 'Collector',
    description: 'Own 10 avatars',
    icon: '🎨',
    category: 'collection',
    rarity: 'rare',
    points: 150,
    requirement: { type: 'avatars_owned', target: 10 },
  },
  {
    id: 'pet_lover',
    title: 'Pet Lover',
    description: 'Own 5 pets',
    icon: '🐾',
    category: 'collection',
    rarity: 'rare',
    points: 150,
    requirement: { type: 'pets_owned', target: 5 },
  },
  
  // Premium
  {
    id: 'supporter',
    title: 'Supporter',
    description: 'Subscribe to any premium tier',
    icon: '💎',
    category: 'premium',
    rarity: 'epic',
    points: 500,
    requirement: { type: 'subscription', target: 1 },
  },
  {
    id: 'ultimate_user',
    title: 'Ultimate User',
    description: 'Subscribe to Ultimate tier',
    icon: '👑',
    category: 'premium',
    rarity: 'legendary',
    points: 1000,
    requirement: { type: 'subscription_ultimate', target: 1 },
    reward: { type: 'avatar', value: 'exclusive_crown' },
  },
];

// ==================== XP SYSTEM ====================

const XP_PER_LEVEL = 1000;
const XP_MULTIPLIER = 1.5;

export function calculateLevel(totalXp: number): number {
  let level = 1;
  let xpNeeded = XP_PER_LEVEL;
  let xpAccumulated = 0;
  
  while (xpAccumulated + xpNeeded <= totalXp) {
    xpAccumulated += xpNeeded;
    level++;
    xpNeeded = Math.floor(xpNeeded * XP_MULTIPLIER);
  }
  
  return level;
}

export function calculateXpForNextLevel(currentLevel: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, currentLevel - 1));
}

// ==================== ACHIEVEMENT MANAGER ====================

export class AchievementManager {
  private userProgress: UserProgress = {
    level: 1,
    xp: 0,
    totalXp: 0,
    coins: 0,
    achievements: [],
    stats: {
      messagesCount: 0,
      conversationsCount: 0,
      daysStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalTimeSpent: 0,
    },
  };

  constructor() {
    this.loadProgress();
  }

  // ==================== PROGRESS ====================

  async loadProgress(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('@user_progress');
      if (stored) {
        this.userProgress = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Achievements] Failed to load progress:', error);
    }
  }

  async saveProgress(): Promise<void> {
    try {
      await AsyncStorage.setItem('@user_progress', JSON.stringify(this.userProgress));
    } catch (error) {
      console.error('[Achievements] Failed to save progress:', error);
    }
  }

  getProgress(): UserProgress {
    return { ...this.userProgress };
  }

  // ==================== XP & LEVELING ====================

  addXp(amount: number, reason?: string): { leveledUp: boolean; newLevel?: number } {
    const oldLevel = this.userProgress.level;
    
    this.userProgress.xp += amount;
    this.userProgress.totalXp += amount;
    
    const newLevel = calculateLevel(this.userProgress.totalXp);
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      this.userProgress.level = newLevel;
      this.userProgress.xp = 0;
      
      // Reward for leveling up
      const coinReward = newLevel * 10;
      this.addCoins(coinReward);
      
      analytics.track('level_up', { level: newLevel, coins_earned: coinReward });
    }
    
    this.saveProgress();
    
    return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
  }

  // ==================== COINS ====================

  addCoins(amount: number): void {
    this.userProgress.coins += amount;
    this.saveProgress();
  }

  spendCoins(amount: number): boolean {
    if (this.userProgress.coins >= amount) {
      this.userProgress.coins -= amount;
      this.saveProgress();
      return true;
    }
    return false;
  }

  // ==================== STATS TRACKING ====================

  incrementStat(stat: keyof UserProgress['stats'], amount: number = 1): void {
    if (typeof this.userProgress.stats[stat] === 'number') {
      (this.userProgress.stats[stat] as number) += amount;
    }
    
    // Update streak
    const today = new Date().toISOString().split('T')[0];
    if (stat === 'conversationsCount') {
      if (this.userProgress.stats.lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (this.userProgress.stats.lastActiveDate === yesterday) {
          this.userProgress.stats.daysStreak++;
        } else {
          this.userProgress.stats.daysStreak = 1;
        }
        this.userProgress.stats.lastActiveDate = today;
      }
    }
    
    this.saveProgress();
    this.checkAchievements();
  }

  // ==================== ACHIEVEMENTS ====================

  checkAchievements(): void {
    ACHIEVEMENTS.forEach((achievement) => {
      if (this.userProgress.achievements.includes(achievement.id)) {
        return; // Already unlocked
      }
      
      if (this.checkRequirement(achievement.requirement)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  private checkRequirement(requirement: Achievement['requirement']): boolean {
    const { type, target } = requirement;
    const stats = this.userProgress.stats;
    
    switch (type) {
      case 'conversations':
        return stats.conversationsCount >= target;
      case 'messages':
        return stats.messagesCount >= target;
      case 'streak':
        return stats.daysStreak >= target;
      // Add more types as needed
      default:
        return false;
    }
  }

  private unlockAchievement(achievement: Achievement): void {
    this.userProgress.achievements.push(achievement.id);
    this.addXp(achievement.points);
    
    // Apply reward
    if (achievement.reward) {
      if (achievement.reward.type === 'coins') {
        this.addCoins(achievement.reward.value as number);
      }
    }
    
    this.saveProgress();
    
    analytics.track('achievement_unlocked', {
      achievement_id: achievement.id,
      achievement_title: achievement.title,
      points: achievement.points,
    });
    
    // Notify user
    console.log(`🏆 Achievement Unlocked: ${achievement.title}`);
  }

  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter((a) => this.userProgress.achievements.includes(a.id));
  }

  getLockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter((a) => !this.userProgress.achievements.includes(a.id));
  }
}

// ==================== SINGLETON ====================

export const achievementManager = new AchievementManager();

// ==================== REACT HOOKS ====================

export function useAchievements() {
  return {
    progress: achievementManager.getProgress(),
    addXp: achievementManager.addXp.bind(achievementManager),
    incrementStat: achievementManager.incrementStat.bind(achievementManager),
    unlocked: achievementManager.getUnlockedAchievements(),
    locked: achievementManager.getLockedAchievements(),
  };
}
