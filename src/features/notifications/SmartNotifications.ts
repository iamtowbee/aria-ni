// src/features/notifications/SmartNotifications.ts
/**
 * Smart Notifications System
 * 
 * Intelligent notification management:
 * - Context-aware notifications
 * - Smart scheduling
 * - Do not disturb mode
 * - Priority-based delivery
 * - Notification grouping
 * - Action buttons
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SmartNotification {
  id: string;
  title: string;
  body: string;
  category: 'agent' | 'achievement' | 'reminder' | 'system' | 'social';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actions?: NotificationAction[];
  data?: Record<string, any>;
  scheduledFor?: number;
  expiresAt?: number;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  sound: boolean;
  vibrate: boolean;
  grouping: boolean;
}

/**
 * SmartNotifications
 * 
 * Context-aware notification system
 */
export class SmartNotifications {
  private preferences: NotificationPreferences = {
    enabled: true,
    categories: {
      agent: true,
      achievement: true,
      reminder: true,
      system: true,
      social: true,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    sound: true,
    vibrate: true,
    grouping: true,
  };

  private notificationHistory: SmartNotification[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly STORAGE_KEY = 'smart_notifications_prefs';

  constructor() {
    this.configureNotifications();
  }

  /**
   * Configure notification handlers
   */
  private configureNotifications(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: this.preferences.enabled,
        shouldPlaySound: this.preferences.sound,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Send a smart notification
   */
  async sendNotification(notification: Omit<SmartNotification, 'id'>): Promise<string> {
    // Check if notifications are enabled
    if (!this.preferences.enabled) {
      console.log('[SmartNotifications] Notifications disabled');
      return '';
    }

    // Check category preferences
    if (!this.preferences.categories[notification.category]) {
      console.log(`[SmartNotifications] Category ${notification.category} disabled`);
      return '';
    }

    // Check quiet hours
    if (this.isQuietHours() && notification.priority !== 'urgent') {
      console.log('[SmartNotifications] Quiet hours active, deferring notification');
      // Schedule for after quiet hours
      return this.scheduleAfterQuietHours(notification);
    }

    const smartNotification: SmartNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
    };

    // Send notification
    const notificationId = await this.deliverNotification(smartNotification);

    // Add to history
    this.addToHistory(smartNotification);

    return notificationId;
  }

  /**
   * Deliver notification
   */
  private async deliverNotification(notification: SmartNotification): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: this.preferences.sound,
          vibrate: this.preferences.vibrate ? [0, 250, 250, 250] : undefined,
          priority: this.mapPriority(notification.priority),
        },
        trigger: notification.scheduledFor 
          ? { seconds: (notification.scheduledFor - Date.now()) / 1000 }
          : null,
      });

      console.log(`[SmartNotifications] Sent: ${notification.title}`);
      return notificationId;
    } catch (error) {
      console.error('[SmartNotifications] Delivery failed:', error);
      return '';
    }
  }

  /**
   * Schedule notification for after quiet hours
   */
  private async scheduleAfterQuietHours(
    notification: Omit<SmartNotification, 'id'>
  ): Promise<string> {
    const endTime = this.parseTime(this.preferences.quietHours.end);
    const now = new Date();
    
    const scheduledTime = new Date();
    scheduledTime.setHours(endTime.hours, endTime.minutes, 0, 0);

    // If end time is tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return this.sendNotification({
      ...notification,
      scheduledFor: scheduledTime.getTime(),
    });
  }

  /**
   * Check if current time is in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const start = this.parseTime(this.preferences.quietHours.start);
    const end = this.parseTime(this.preferences.quietHours.end);

    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;

    // Handle overnight quiet hours
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Parse time string (HH:MM)
   */
  private parseTime(time: string): { hours: number; minutes: number } {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Map priority to Expo priority
   */
  private mapPriority(priority: SmartNotification['priority']): Notifications.AndroidNotificationPriority {
    const map = {
      low: Notifications.AndroidNotificationPriority.LOW,
      normal: Notifications.AndroidNotificationPriority.DEFAULT,
      high: Notifications.AndroidNotificationPriority.HIGH,
      urgent: Notifications.AndroidNotificationPriority.MAX,
    };
    return map[priority];
  }

  /**
   * Send achievement notification
   */
  async notifyAchievement(
    title: string,
    description: string,
    xp: number
  ): Promise<void> {
    await this.sendNotification({
      title: `🏆 ${title}`,
      body: `${description}\n+${xp} XP earned!`,
      category: 'achievement',
      priority: 'high',
      data: { type: 'achievement', xp },
    });
  }

  /**
   * Send agent response notification
   */
  async notifyAgentResponse(agentName: string, message: string): Promise<void> {
    await this.sendNotification({
      title: `${agentName} has responded`,
      body: message.substring(0, 100),
      category: 'agent',
      priority: 'normal',
      data: { type: 'agent_response', agent: agentName },
    });
  }

  /**
   * Send reminder
   */
  async sendReminder(
    title: string,
    message: string,
    scheduledFor: number
  ): Promise<void> {
    await this.sendNotification({
      title,
      body: message,
      category: 'reminder',
      priority: 'high',
      scheduledFor,
      data: { type: 'reminder' },
    });
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification history
   */
  getHistory(limit: number = 20): SmartNotification[] {
    return this.notificationHistory.slice(-limit);
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.notificationHistory = [];
  }

  /**
   * Add to history
   */
  private addToHistory(notification: SmartNotification): void {
    this.notificationHistory.push(notification);

    if (this.notificationHistory.length > this.MAX_HISTORY) {
      this.notificationHistory.shift();
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };

    await this.savePreferences();
    this.configureNotifications();
  }

  /**
   * Get preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalSent: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    quietHoursDeferred: number;
  } {
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    this.notificationHistory.forEach(notif => {
      byCategory[notif.category] = (byCategory[notif.category] || 0) + 1;
      byPriority[notif.priority] = (byPriority[notif.priority] || 0) + 1;
    });

    return {
      totalSent: this.notificationHistory.length,
      byCategory,
      byPriority,
      quietHoursDeferred: 0, // Track in production
    };
  }

  /**
   * Request permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * Save preferences
   */
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('[SmartNotifications] Save failed:', error);
    }
  }

  /**
   * Load preferences
   */
  async loadPreferences(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.preferences = JSON.parse(saved);
        this.configureNotifications();
      }
    } catch (error) {
      console.error('[SmartNotifications] Load failed:', error);
    }
  }
}

// Singleton instance
export const smartNotifications = new SmartNotifications();
